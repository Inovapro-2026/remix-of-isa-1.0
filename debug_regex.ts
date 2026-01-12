const msg = "Quero o B1B717";
const regex = /\b([A-Z0-9]{3,}(?:-[A-Z0-9]+)?)\b/i;

const match = msg.match(regex);
console.log(`Msg: "${msg}"`);
console.log(`Regex: ${regex}`);
console.log(`Match:`, match);

if (match) {
    console.log(`Captured: ${match[1]}`);
} else {
    console.log(`No match.`);
}

const msg2 = "B1B717";
const match2 = msg2.match(regex);
console.log(`\nMsg2: "${msg2}"`);
console.log(`Match2:`, match2);
