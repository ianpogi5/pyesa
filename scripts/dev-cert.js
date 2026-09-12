/**
 * Generates a self-signed cert for `npm run dev:https`, so the dev server is a
 * secure context on the LAN. The Screen Wake Lock API (and anything else
 * gated on https) is simply absent over a plain http:// LAN address, which
 * makes fullscreen performance mode untestable on a real tablet without this.
 *
 * Writes certs/dev.{key,crt} (gitignored). Regenerates when missing or when
 * the machine's LAN address changed.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "certs");
const key = join(dir, "dev.key");
const crt = join(dir, "dev.crt");
const stamp = join(dir, "dev.hosts");

export function lanAddresses() {
  const out = [];
  for (const iface of Object.values(networkInterfaces()).flat()) {
    if (iface && iface.family === "IPv4" && !iface.internal) out.push(iface.address);
  }
  return out;
}

export function ensureDevCert() {
  const hosts = ["localhost", "127.0.0.1", ...lanAddresses()];
  const want = hosts.join(",");

  if (existsSync(key) && existsSync(crt) && existsSync(stamp)) {
    if (readFileSync(stamp, "utf8").trim() === want) return { key, crt, hosts };
  }

  mkdirSync(dir, { recursive: true });
  const alt = hosts
    .map((h, i) => (/^[\d.]+$/.test(h) ? `IP.${i} = ${h}` : `DNS.${i} = ${h}`))
    .join("\n");
  const conf = join(dir, "dev.cnf");
  writeFileSync(
    conf,
    `[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=Pyesa dev\n[ext]\nsubjectAltName=@alt\nbasicConstraints=critical,CA:false\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n[alt]\n${alt}\n`,
  );

  execFileSync(
    "openssl",
    ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "825",
     "-keyout", key, "-out", crt, "-config", conf],
    { stdio: "ignore" },
  );
  writeFileSync(stamp, want);
  return { key, crt, hosts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { hosts } = ensureDevCert();
  console.log("dev cert covers:", hosts.join(", "));
  for (const h of hosts.filter((x) => /^\d/.test(x))) {
    console.log(`  https://${h}:5173  <- open this on the iPad`);
  }
  console.log("\nSafari will warn about the self-signed cert: tap Show Details");
  console.log("-> Visit this Website to accept it. Only then is it a secure");
  console.log("context, which is what the wake lock needs.");
}
