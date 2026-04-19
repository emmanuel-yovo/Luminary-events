/**
 * Input Validation & Sanitization
 * Centralized validation for all user inputs
 */

// ─── BANNED WORDS FILTER ───
const BANNED_WORDS = [
    // Violence / Haine
    'nazi', 'terroris', 'jihad', 'génocide', 'supremaci', 'extrémi',
    // Arnaques
    'arnaque', 'scam', 'pyramide', 'ponzi', 'mlm',
    // Contenu adulte
    'xxx', 'porn', 'escort',
    // Drogues
    'drogue', 'cannabis', 'cocaïne', 'héroïne', 'meth',
    // Discrimination
    'homophob', 'racis', 'sexis', 'antisémit',
    // Spam
    'gagner de l\'argent facile', 'devenir riche', 'cliquez ici'
];

const VALID_CATEGORIES = [
    'Concert', 'Conférence', 'Salon', 'Mariage', 'Sport', 'Atelier', 'Festival', 'Autre'
];

/**
 * Sanitize a string: trim, remove HTML tags, limit length
 */
export function sanitize(input, maxLength = 500) {
    if (!input || typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/[<>]/g, '')    // Extra safety
        .slice(0, maxLength);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
}

/**
 * Check if a date is in the future (Policy #6)
 */
export function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
}

/**
 * Check text for banned content (Policy #4)
 * Returns { clean: boolean, matches: string[] }
 */
export function checkBannedContent(text) {
    if (!text) return { clean: true, matches: [] };
    const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matches = BANNED_WORDS.filter(word => {
        const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return lowerText.includes(normalizedWord);
    });
    return { clean: matches.length === 0, matches };
}

/**
 * Validate event creation/update input (Policies #4, #5, #6, #8)
 * Returns { valid: boolean, errors: string[] }
 */
export function validateEventInput(data) {
    const errors = [];

    // Policy #5: Minimum viable event
    if (!data.title || sanitize(data.title).length < 3) {
        errors.push('Le titre doit contenir au moins 3 caractères.');
    }
    if (sanitize(data.title).length > 150) {
        errors.push('Le titre ne peut pas dépasser 150 caractères.');
    }

    // Policy #6: Future date required
    if (!data.date || !isValidDate(data.date)) {
        errors.push('La date de début est invalide.');
    } else if (!isFutureDate(data.date)) {
        errors.push('La date de l\'événement doit être dans le futur.');
    }

    if (data.endDate && !isValidDate(data.endDate)) {
        errors.push('La date de fin est invalide.');
    }
    if (data.endDate && data.date && new Date(data.endDate) < new Date(data.date)) {
        errors.push('La date de fin ne peut pas être avant la date de début.');
    }

    // Policy #5: Location required
    if (!data.location || sanitize(data.location).length < 2) {
        errors.push('Le lieu est requis (min. 2 caractères).');
    }

    // Policy #8: Valid category required
    if (!data.category) {
        errors.push('La catégorie est requise.');
    } else if (!VALID_CATEGORIES.includes(data.category)) {
        errors.push(`Catégorie invalide. Choisissez parmi : ${VALID_CATEGORIES.join(', ')}.`);
    }

    // Policy #5: Minimum description length
    if (data.description && sanitize(data.description).length > 0 && sanitize(data.description).length < 50) {
        errors.push('La description doit contenir au moins 50 caractères pour être informative.');
    }

    // Policy #4: Banned content filter
    const titleCheck = checkBannedContent(data.title);
    if (!titleCheck.clean) {
        errors.push('Le titre contient du contenu interdit. Veuillez le reformuler.');
    }
    const descCheck = checkBannedContent(data.description);
    if (!descCheck.clean) {
        errors.push('La description contient du contenu interdit. Veuillez la reformuler.');
    }

    // Validate tickets
    if (data.tickets) {
        let tickets = data.tickets;
        if (typeof tickets === 'string') {
            try { tickets = JSON.parse(tickets); } catch { errors.push('Format de tickets invalide.'); }
        }
        if (Array.isArray(tickets)) {
            tickets.forEach((t, i) => {
                if (t.price < 0) errors.push(`Le prix du billet ${i + 1} ne peut pas être négatif.`);
                if (t.quantity < 1) errors.push(`La quantité du billet ${i + 1} doit être au moins 1.`);
            });
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate registration input
 */
export function validateRegistration(data) {
    const errors = [];
    
    if (!data.name || sanitize(data.name).length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères.');
    }
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email invalide.');
    }
    if (!data.password || data.password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères.');
    }

    return { valid: errors.length === 0, errors };
}

