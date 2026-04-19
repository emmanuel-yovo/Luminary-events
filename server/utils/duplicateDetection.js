/**
 * Hybrid Duplicate Detection Utilities
 * Combines: exact match + fuzzy title similarity + GPS proximity
 */

/**
 * Levenshtein distance between two strings (edit distance)
 */
export function levenshtein(a, b) {
    const matrix = [];
    const aLen = a.length;
    const bLen = b.length;

    if (aLen === 0) return bLen;
    if (bLen === 0) return aLen;

    for (let i = 0; i <= bLen; i++) matrix[i] = [i];
    for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

    for (let i = 1; i <= bLen; i++) {
        for (let j = 1; j <= aLen; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,       // insertion
                    matrix[i - 1][j] + 1        // deletion
                );
            }
        }
    }
    return matrix[bLen][aLen];
}

/**
 * Returns similarity ratio between 0 and 1 (1 = identical)
 */
export function titleSimilarity(a, b) {
    const normA = (a || '').trim().toLowerCase();
    const normB = (b || '').trim().toLowerCase();
    if (normA === normB) return 1;
    const maxLen = Math.max(normA.length, normB.length);
    if (maxLen === 0) return 1;
    return 1 - (levenshtein(normA, normB) / maxLen);
}

/**
 * Haversine formula: distance in meters between two GPS coordinates
 */
export function gpsDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Check if two date ranges overlap or are within ±dayRange days
 * Supports single-day events (no endDate) and multi-day events
 */
export function datesOverlapOrClose(startA, endA, startB, endB, dayRange = 3) {
    try {
        const a1 = new Date(startA);
        const a2 = endA ? new Date(endA) : a1;
        const b1 = new Date(startB);
        const b2 = endB ? new Date(endB) : b1;

        // Check direct overlap: A starts before B ends AND A ends after B starts
        if (a1 <= b2 && a2 >= b1) return true;

        // Check proximity: closest edges within dayRange
        const msPerDay = 1000 * 60 * 60 * 24;
        const gapMs = Math.min(
            Math.abs(a1 - b2),
            Math.abs(a2 - b1)
        );
        return (gapMs / msPerDay) <= dayRange;
    } catch {
        return false;
    }
}

/**
 * HYBRID DUPLICATE DETECTION
 * Returns { isDuplicate: boolean, reason: string, confidence: string } 
 * 
 * Rules:
 * 1. EXACT: same title (case-insensitive) + same date + same location string → blocked
 * 2. FUZZY: title similarity ≥ 80% + overlapping dates + same city → blocked  
 * 3. GEO:   same category + dates overlap or ±3 days + GPS within 500m + title similarity ≥ 60% → blocked
 */
export function detectDuplicate(newEvent, existingEvents) {
    const normTitle = (newEvent.title || '').trim().toLowerCase();
    const normLocation = (newEvent.location || '').trim().toLowerCase();
    const normCity = (newEvent.city || '').trim().toLowerCase();
    const newLat = newEvent.latitude ? parseFloat(newEvent.latitude) : null;
    const newLng = newEvent.longitude ? parseFloat(newEvent.longitude) : null;

    for (const existing of existingEvents) {
        const exTitle = (existing.title || '').trim().toLowerCase();
        const exLocation = (existing.location || '').trim().toLowerCase();
        const exCity = (existing.city || '').trim().toLowerCase();
        const exLat = existing.latitude ? parseFloat(existing.latitude) : null;
        const exLng = existing.longitude ? parseFloat(existing.longitude) : null;

        // --- RULE 1: EXACT MATCH ---
        if (normTitle === exTitle && newEvent.date === existing.date && normLocation === exLocation) {
            return {
                isDuplicate: true,
                reason: `Doublon exact détecté : "${existing.title}" a lieu le même jour au même endroit.`,
                confidence: 'haute'
            };
        }

        // --- RULE 2: FUZZY TITLE + OVERLAPPING DATES + SAME CITY ---
        const similarity = titleSimilarity(newEvent.title, existing.title);
        const datesMatch = datesOverlapOrClose(newEvent.date, newEvent.endDate, existing.date, existing.endDate, 0);
        if (similarity >= 0.8 && datesMatch && normCity && normCity === exCity) {
            return {
                isDuplicate: true,
                reason: `Événement très similaire détecté : "${existing.title}" (${Math.round(similarity * 100)}% similaire) dates chevauchantes, même ville.`,
                confidence: 'haute'
            };
        }

        // --- RULE 3: GEO PROXIMITY + CATEGORY + DATE WINDOW ---
        if (
            newEvent.category === existing.category &&
            datesOverlapOrClose(newEvent.date, newEvent.endDate, existing.date, existing.endDate, 3) &&
            newLat && newLng && exLat && exLng
        ) {
            const distance = gpsDistance(newLat, newLng, exLat, exLng);
            const titleSim = titleSimilarity(newEvent.title, existing.title);

            if (distance <= 500 && titleSim >= 0.6) {
                return {
                    isDuplicate: true,
                    reason: `Événement similaire à proximité : "${existing.title}" (${Math.round(distance)}m, ${Math.round(titleSim * 100)}% similaire, dates proches).`,
                    confidence: 'moyenne'
                };
            }
        }
    }

    return { isDuplicate: false, reason: null, confidence: null };
}
