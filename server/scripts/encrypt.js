process.env.NODE_ENV === "production"
const crypto = require("crypto");
const fs = require("fs");
const config = require("../config/config");

let defaultKey = config.encryptKey;
let defaultIv = config.encryptIv;

const encrypt = (data, key = defaultKey, iv = defaultIv) => {
  let cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return cipher.update(data, "utf8", "hex") + cipher.final("hex");
}



(() => {
  let data = fs.readFileSync(__dirname + "/../config/keys.json");
  const decrypted = encrypt(data);
  fs.writeFileSync(__dirname + "/../config/keys", decrypted.toString("utf8"));
})();