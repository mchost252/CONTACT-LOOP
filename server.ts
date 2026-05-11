import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for server-side use (using modular SDK for simplicity without service account)
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: VCF Generation
  app.get("/api/vcf/:category?", async (req, res) => {
    try {
      const category = req.params.category;
      const now = Timestamp.now();
      
      const usersRef = collection(db, "users");
      let q = query(
        usersRef, 
        where("expiresAt", ">=", now),
        orderBy("expiresAt", "desc")
      );

      if (category && category.toLowerCase() !== 'all') {
        // Capitalize first letter to match our enum
        const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        q = query(
          usersRef, 
          where("expiresAt", ">=", now),
          where("category", "==", formattedCategory),
          orderBy("expiresAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const activeUsers = querySnapshot.docs.map(doc => doc.data());

      // Background Cleanup: Delete contacts older than 4 days to free up space
      const cleanupDate = Timestamp.fromMillis(now.toMillis() - (4 * 24 * 60 * 60 * 1000));
      const oldUsersQuery = query(usersRef, where("expiresAt", "<", cleanupDate));
      getDocs(oldUsersQuery).then(oldSnapshot => {
        oldSnapshot.forEach(oldDoc => {
          // Note: In a production app, use writeBatch or recursive delete for large scale
          // For this applet, simple deletion is fine
          deleteDoc(oldDoc.ref);
        });
      }).catch(err => console.error("Cleanup error:", err));

      let vcfContent = "";
      activeUsers.forEach(user => {
        // Basic VCF format
        vcfContent += `BEGIN:VCARD\n`;
        vcfContent += `VERSION:3.0\n`;
        vcfContent += `FN:${user.name}\n`;
        vcfContent += `TEL;TYPE=CELL:${user.phone}\n`;
        vcfContent += `NOTE:Category: ${user.category} | Via ContactLoop\n`;
        vcfContent += `END:VCARD\n`;
      });

      if (vcfContent === "") {
        vcfContent = "BEGIN:VCARD\nVERSION:3.0\nFN:ContactLoop Info\nNOTE:No active contacts found for this category today.\nEND:VCARD\n";
      }

      const filename = `contactloop_${category || 'all'}_${new Date().toISOString().split('T')[0]}.vcf`;
      
      res.setHeader("Content-Type", "text/vcard");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(vcfContent);
    } catch (error) {
      console.error("VCF Generation Error:", error);
      res.status(500).send("Error generating VCF");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
