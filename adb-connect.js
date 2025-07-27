const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Cache file location
const CACHE_PATH = path.join(os.tmpdir(), "adb-connect-cache.json");

// Ask with optional default
function askQuestionWithDefault(question, defaultValue) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (input) => {
      resolve(input.trim() || defaultValue);
    });
  });
}

// Run adb commands
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

// Load previous values
function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

// Save latest values
function saveCache(data) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
}

async function main() {
  console.log("📱 ADB Wireless Debugging Setup\n");

  const cache = loadCache();

  const ip = await askQuestionWithDefault(
    "🔌 Enter device IP address (e.g. 192.168.1.100)",
    cache.ip,
  );
  const connectionPort = await askQuestionWithDefault(
    "🎯 Enter connection port (from main 'Wireless Debugging' screen)",
    cache.connectionPort,
  );
  const pairingPort = await askQuestionWithDefault(
    "📡 Enter pairing port (from 'Pair device with pairing code')",
    cache.pairingPort,
  );

  rl.close();

  // Save new cache
  saveCache({ ip, pairingPort, connectionPort });

  try {
    console.log(
      "\n🔗 Pairing device (you'll be prompted for the 6-digit pairing code)...",
    );
    await runCommand("adb", ["pair", `${ip}:${pairingPort}`]);

    console.log("\n🔌 Connecting to device...");
    await runCommand("adb", ["connect", `${ip}:${connectionPort}`]);

    console.log("\n✅ Device connected successfully!");
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("\n❌ Cancelled by user.");
  rl.close();
  process.exit(0);
});

main();
