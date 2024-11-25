const Terser = require('terser');
const fs = require('fs');

async function minify() {
    // Membaca file JavaScript yang ingin dipinifikasi
    const code = fs.readFileSync('script2222.js', 'utf8');

    // Meminifikasi kode
    const minified = await Terser.minify(code);

    // Menyimpan hasil minifikasi ke file baru
    fs.writeFileSync('script.min.js', minified.code);
    console.log('File berhasil dipinifikasi!');
}

minify().catch(console.error);