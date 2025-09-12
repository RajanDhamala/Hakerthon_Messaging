import { useEffect } from "react";
import useKeyStore from "./Zustand/keyStore";

export default function GenerateKeys() {
  const setKeys = useKeyStore((state) => state.setKeys);
  const privateKey = useKeyStore((state) => state.privateKey);
  const publicKey = useKeyStore((state) => state.publicKey);

  useEffect(() => {
    // Only generate keys if they don't already exist
    if (!privateKey || !publicKey) {
      async function generateKeys() {
        function arrayBufferToBase64(buffer) {
          return btoa(String.fromCharCode(...new Uint8Array(buffer)));
        }

        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: "ECDH",
            namedCurve: "P-256",
          },
          true,
          ["deriveKey", "deriveBits"]
        );

        const exportedPublicKey = await window.crypto.subtle.exportKey(
          "spki",
          keyPair.publicKey
        );
        const exportedPrivateKey = await window.crypto.subtle.exportKey(
          "pkcs8",
          keyPair.privateKey
        );

        const publicKeyBase64 = arrayBufferToBase64(exportedPublicKey);
        const privateKeyBase64 = arrayBufferToBase64(exportedPrivateKey);

        setKeys({ privateKey: privateKeyBase64, publicKey: publicKeyBase64 });
        console.log("Keys generated!");
      }

      generateKeys();
    }
  }, [privateKey, publicKey, setKeys]);

  return (
    <>
      <h1>Key generation component</h1>
      <p>{privateKey && publicKey ? "Keys already generated" : "Generating keys..."}</p>
    </>
  );
}
