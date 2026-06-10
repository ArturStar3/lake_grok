// Скрипт для извлечения ISO кодов стран из GeoJSON
// Запустите этот файл в Node.js или в консоли браузера

const fs = require('fs');
const path = require('path');

// Путь к файлу GeoJSON
const geoJsonPath = path.join(__dirname, 'public', 'geo', 'custom.geo.json');

// Читаем файл
const geoJsonData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));

// Извлекаем ISO коды
const isoCodes = [];

if (geoJsonData.features) {
    geoJsonData.features.forEach(feature => {
        const props = feature.properties;
        const isoCode = props.ISO_A2 || props.iso_a2 || props.iso_a3 || props.ISO_A3 || feature.id;
        const name = props.name || props.name_en || props.admin;
        
        if (isoCode && name) {
            isoCodes.push({
                iso_code: isoCode,
                name: name,
                name_long: props.name_long || name
            });
        }
    });
}

// Удаляем дубликаты по iso_code
const uniqueCodes = {};
isoCodes.forEach(item => {
    if (!uniqueCodes[item.iso_code]) {
        uniqueCodes[item.iso_code] = item;
    }
});

// Сортируем по имени
const sortedCodes = Object.values(uniqueCodes).sort((a, b) => a.name.localeCompare(b.name));

console.log('=== ISO Коды стран для добавления в бэкенд ===\n');
console.log('Всего стран:', sortedCodes.length);
console.log('\n=== Список в формате JSON ===\n');
console.log(JSON.stringify(sortedCodes, null, 2));

console.log('\n=== Список в формате SQL (пример) ===\n');
sortedCodes.forEach(item => {
    console.log(`INSERT INTO countries (iso_code, name, name_long) VALUES ('${item.iso_code}', '${item.name}', '${item.name_long}');`);
});

console.log('\n=== Список в формате Python Dictionary ===\n');
console.log('ISO_CODES = {');
sortedCodes.forEach((item, index) => {
    const comma = index < sortedCodes.length - 1 ? ',' : '';
    console.log(`    "${item.iso_code}": "${item.name}"${comma}`);
});
console.log('}');

// Сохраняем в файл
fs.writeFileSync(
    path.join(__dirname, 'iso_codes_export.json'), 
    JSON.stringify(sortedCodes, null, 2)
);

console.log('\n✓ Результат сохранен в файл: iso_codes_export.json');
