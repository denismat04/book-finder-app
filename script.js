// /c:/Users/denis/Desktop/DIGCOMPEDO/book finder ai/book-finder-app/script.js
// Minimal, dependency-free script pentru căutare cărți via Open Library

(function () {
    // Găsește elementele existente din `index.html` (aliniate la ID-urile folosite acolo)
    const form = document.getElementById('search-form') || document.querySelector('form');
    const input = document.getElementById('query') || document.querySelector('input[type="search"], input[name="q"]');
    const resultsSection = document.getElementById('results'); // secțiunea care conține placeholder + list
    let resultsList = document.getElementById('results-list'); // ul pentru rezultate
    let placeholder = document.getElementById('results-placeholder'); // p cu mesaj implicit

    // Dacă lipsește `resultsList`, creează-l în interiorul secțiunii de rezultate
    if (resultsSection && !resultsList) {
        resultsList = document.createElement('ul');
        resultsList.id = 'results-list';
        resultsList.hidden = true;
        resultsSection.appendChild(resultsList);
    }
    // Asigură un placeholder vizibil dacă lipsește
    if (resultsSection && !placeholder) {
        placeholder = document.createElement('p');
        placeholder.id = 'results-placeholder';
        placeholder.className = 'placeholder';
        placeholder.textContent = 'Nicio căutare efectuată. Introdu un cuvânt cheie și apasă "Caută".';
        resultsSection.insertBefore(placeholder, resultsList || null);
    }

    // Helper pentru URL imagine copertă
    function getCoverUrl(doc) {
        if (doc.cover_i) {
            return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
        }
        if (doc.cover_edition_key) {
            return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
        }
        if (doc.isbn && doc.isbn.length) {
            return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
        }
        return null; // fallback handled by caller
    }

    // Afișare mesaj simplu în placeholder (mai accesibil pentru utilizator)
    function showMessage(text, isError = false) {
        if (!placeholder) return;
        placeholder.textContent = text;
        placeholder.style.color = isError ? 'crimson' : '';
        placeholder.hidden = false;
        if (resultsList) resultsList.hidden = true;
    }

    // Curăță rezultatele anterioare
    function clearResults() {
        if (resultsList) {
            resultsList.innerHTML = '';
            resultsList.hidden = true;
        }
        if (placeholder) {
            placeholder.style.color = '';
        }
    }

    // Creează un card pentru un rezultat
    function createCard(doc) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.border = '1px solid #ddd';
        card.style.padding = '8px';
        card.style.margin = '8px 0';
        card.style.display = 'flex';
        card.style.gap = '12px';
        card.style.alignItems = 'center';

        const coverUrl = getCoverUrl(doc);
        const img = document.createElement('img');
        img.alt = doc.title || 'Copertă';
        img.style.width = '80px';
        img.style.height = '120px';
        img.style.objectFit = 'cover';
        img.style.background = '#f4f4f4';
        if (coverUrl) {
            img.src = coverUrl;
        } else {
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="100%" height="100%" fill="%23f4f4f4"/><text x="50%" y="50%" font-size="10" text-anchor="middle" fill="%23999" dy=".3em">No cover</text></svg>';
        }

        const meta = document.createElement('div');
        meta.style.flex = '1';

        const title = document.createElement('div');
        const titleLink = document.createElement('a');
        titleLink.textContent = doc.title || 'Titlu necunoscut';
        titleLink.href = doc.key ? `https://openlibrary.org${doc.key}` : '#';
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.style.color = '#222';
        titleLink.style.textDecoration = 'none';
        titleLink.style.fontSize = '1.05em';
        title.appendChild(titleLink);
        title.style.fontWeight = '600';

        const author = document.createElement('div');
        author.textContent = (doc.author_name && doc.author_name.join(', ')) || 'Autor necunoscut';
        author.style.color = '#555';
        author.style.fontSize = '0.95em';

        const info = document.createElement('div');
        info.style.marginTop = '6px';
        info.style.fontSize = '0.85em';
        info.style.color = '#666';
        const year = doc.first_publish_year ? ` • ${doc.first_publish_year}` : '';
        info.textContent = `${doc.publisher && doc.publisher[0] ? doc.publisher[0] : ''}${year}`;

        const link = document.createElement('a');
        link.href = doc.key ? `https://openlibrary.org${doc.key}` : '#';
        link.textContent = 'Vezi pe Open Library';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'inline-block';
        link.style.marginTop = '6px';
        link.style.fontSize = '0.85em';

        meta.appendChild(title);
        meta.appendChild(author);
        meta.appendChild(info);
        meta.appendChild(link);

        card.appendChild(img);
        card.appendChild(meta);

        return card;
    }

    // Cerere către Open Library și procesare rezultate
    async function searchBooks(query) {
        clearResults();
        showMessage('Se caută...', false);

        const encoded = encodeURIComponent(query);
        const url = `https://openlibrary.org/search.json?q=${encoded}&limit=20`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data.docs || data.docs.length === 0) {
                showMessage('Nu s-au găsit rezultate pentru căutarea dată.', false);
                return;
            }

            showMessage(`S-au găsit ${data.numFound} rezultate. Afișez primele ${data.docs.length}.`, false);

            // Afișează lista și ascunde placeholder-ul
            if (resultsList) {
                placeholder.hidden = true;
                resultsList.hidden = false;

                data.docs.forEach(doc => {
                    const card = createCard(doc);
                    const li = document.createElement('li');
                    li.appendChild(card);
                    resultsList.appendChild(li);
                });
            } else {
                // Fallback: append direct în secțiune dacă nu există `ul`
                data.docs.forEach(doc => {
                    const card = createCard(doc);
                    resultsSection.appendChild(card);
                });
            }
        } catch (err) {
            console.error(err);
            clearResults();
            showMessage('Eroare de rețea sau a apărut o problemă. Încearcă din nou.', true);
        }
    }

    // Legare eveniment submit
    if (form && input) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const q = input.value.trim();
            if (!q) {
                showMessage('Introduceți titlu, autor sau cuvânt-cheie pentru a căuta.', true);
                return;
            }
            clearResults();
            searchBooks(q);
        });
    } else {
        console.warn('Formularele sau input-urile nu au fost găsite. Verifică că `#search-form` și `#query` există în HTML.');
    }
})();