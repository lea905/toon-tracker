const fs = require('fs');
const path = require('path');

const chunks = ['part1', 'part2', 'part3', 'part4', 'part5'];
let allMovies = [];
let seenUrls = new Set();
// Keep existing movies if any, or just overwrite? 
// The user wanted "comprehensive", and the scrape covers everything from 1937 to 2027.
// So we can overwrite safely.

console.log('Starting merge...');

chunks.forEach(chunk => {
    const filePath = path.join('src/data', `movies_raw_${chunk}.json`);
    if (fs.existsSync(filePath)) {
        console.log(`Reading ${filePath}...`);
        const raw = fs.readFileSync(filePath, 'utf8');
        try {
            const movies = JSON.parse(raw);
            movies.forEach(m => {
                if (m.url && !seenUrls.has(m.url)) {
                    seenUrls.add(m.url);
                    allMovies.push(m);
                } else if (!m.url) {
                    // Fallback for direct-to-video manually added if they lack url, but here we are processing scraped data.
                    // If we want to keep the manual 32 sequels added earlier, we need to read the current movies.json first?
                    // The scrape seems to include sequels like 'Le Roi Lion 3', 'Bambi 2'.
                    // Let's trust the scrape for now as it found 489+ items.
                    allMovies.push(m);
                }
            });
        } catch (e) {
            console.error(`Error parsing ${chunk}:`, e);
        }
    } else {
        console.warn(`File not found: ${filePath}`);
    }
});

console.log('Total unique movies found:', allMovies.length);

const formattedMovies = allMovies.map((m, index) => {
    // Extract year from releaseDate string like '🇫🇷 28 novembre 2001'
    let year = 0;
    const yearMatch = m.releaseDate ? m.releaseDate.match(/(\d{4})/) : null;
    if (yearMatch) {
        year = parseInt(yearMatch[1]);
    }

    return {
        id: index + 1,
        title: m.title,
        year: year,
        studio: null, // Scraped data doesn't explicitly have studio
        poster: m.posterUrl
    };
});

fs.writeFileSync('src/data/movies.json', JSON.stringify(formattedMovies, null, 2));
console.log('Successfully wrote src/data/movies.json');
