```javascript
/* =========================================================
   SPATIUM GAMES SYSTEM
   ========================================================= */

const gameGrid = document.getElementById("game-grid");
const gameSearch = document.getElementById("game-search");
const gameSort = document.getElementById("game-sort");
const gameCount = document.getElementById("game-count");

const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const clearSearch = document.getElementById("clear-search");
const currentYear = document.getElementById("current-year");

let games = [];


/* =========================================================
   YEAR
   ========================================================= */

currentYear.textContent = new Date().getFullYear();


/* =========================================================
   LOAD GAME LIBRARY
   ========================================================= */

async function loadGames() {

    try {

        /*
         * Master list:
         *
         * games/games.json
         *
         * Example:
         *
         * [
         *     {
         *         "slug": "slope",
         *         "name": "Slope"
         *     }
         * ]
         */

        const response = await fetch(
            "./games/games.json",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `games.json returned ${response.status}`
            );
        }

        const gameList = await response.json();


        /*
         * Load every individual game's JSON.
         */

        games = await Promise.all(

            gameList.map(
                async entry => {

                    /*
                     * Supports either:
                     *
                     * "slope"
                     *
                     * OR
                     *
                     * {
                     *     "slug": "slope",
                     *     "name": "Slope"
                     * }
                     */

                    const slug =
                        typeof entry === "string"
                            ? entry
                            : entry.slug;

                    const fallbackName =
                        typeof entry === "string"
                            ? entry
                            : entry.name;


                    try {

                        const gameResponse =
                            await fetch(
                                `./games/${encodeURIComponent(slug)}/game.json`,
                                {
                                    cache: "no-store"
                                }
                            );


                        if (!gameResponse.ok) {
                            throw new Error(
                                "game.json not found"
                            );
                        }


                        const gameData =
                            await gameResponse.json();


                        return {

                            ...gameData,

                            slug:
                                gameData.slug ||
                                slug,

                            name:
                                gameData.name ||
                                fallbackName ||
                                slug

                        };

                    } catch {

                        /*
                         * If a game JSON is missing,
                         * keep the game in the library
                         * instead of breaking the whole page.
                         */

                        return {

                            name:
                                fallbackName ||
                                slug,

                            slug,

                            category:
                                "Game",

                            description:
                                "",

                            icon:
                                `./assets/game-icons/${slug}.svg`

                        };

                    }

                }
            )

        );


        renderGames();

    } catch (error) {

        console.error(
            "[Spatium Games]",
            error
        );

        gameCount.textContent =
            "Unavailable";

        errorState.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   RENDER
   ========================================================= */

function renderGames() {

    const search =
        gameSearch.value
            .trim()
            .toLowerCase();


    /*
     * Filter
     */

    let visibleGames =
        games.filter(game => {

            const name =
                String(
                    game.name || ""
                ).toLowerCase();

            const category =
                String(
                    game.category || ""
                ).toLowerCase();

            const description =
                String(
                    game.description || ""
                ).toLowerCase();


            return (
                name.includes(search) ||
                category.includes(search) ||
                description.includes(search)
            );

        });


    /*
     * Sort
     */

    visibleGames.sort(
        (a, b) => {

            const comparison =
                String(a.name || "")
                    .localeCompare(
                        String(b.name || ""),
                        undefined,
                        {
                            sensitivity: "base"
                        }
                    );


            if (
                gameSort.value === "za"
            ) {
                return -comparison;
            }


            return comparison;

        }
    );


    /*
     * Clear current cards.
     */

    gameGrid.innerHTML = "";


    /*
     * Count.
     */

    gameCount.textContent =
        `${visibleGames.length} ${
            visibleGames.length === 1
                ? "game"
                : "games"
        }`;


    /*
     * Empty state.
     */

    emptyState.classList.toggle(
        "hidden",
        visibleGames.length !== 0
    );


    /*
     * Create cards.
     */

    visibleGames.forEach(
        game => {

            gameGrid.appendChild(
                createGameCard(game)
            );

        }
    );


    /*
     * Clear button.
     */

    clearSearch.style.display =
        gameSearch.value
            ? "grid"
            : "none";

}


/* =========================================================
   CREATE GAME CARD
   ========================================================= */

function createGameCard(game) {

    const card =
        document.createElement("a");


    card.className =
        "game-card";


    /*
     * Every game gets its own folder.
     *
     * Example:
     *
     * ./games/slope/
     */

    card.href =
        `./games/${encodeURIComponent(game.slug)}/`;


    /*
     * Prevent bad JSON from creating
     * unexpected URLs.
     */

    card.setAttribute(
        "aria-label",
        `Play ${game.name}`
    );


    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    const icon =
        document.createElement("div");

    icon.className =
        "game-icon";


    const image =
        document.createElement("img");


    image.loading =
        "lazy";


    image.alt =
        "";


    /*
     * The JSON can specify an icon.
     *
     * Example:
     *
     * "icon": "../../assets/game-icons/slope.svg"
     *
     * If there is no icon in the JSON,
     * automatically use:
     *
     * assets/game-icons/[slug].svg
     */

    const iconPath =
        game.icon ||
        `./assets/game-icons/${game.slug}.svg`;


    image.src =
        iconPath;


    image.addEventListener(
        "error",
        () => {

            image.remove();

            createFallbackIcon(
                icon,
                game.name
            );

        },
        {
            once: true
        }
    );


    icon.appendChild(
        image
    );


    /* -----------------------------------------
       INFO
    ----------------------------------------- */

    const info =
        document.createElement("div");

    info.className =
        "game-info";


    const name =
        document.createElement("div");

    name.className =
        "game-name";

    name.textContent =
        game.name;


    const meta =
        document.createElement("div");

    meta.className =
        "game-meta";

    meta.textContent =
        game.category ||
        "Game";


    info.appendChild(
        name
    );

    info.appendChild(
        meta
    );


    card.appendChild(
        icon
    );

    card.appendChild(
        info
    );


    return card;

}


/* =========================================================
   FALLBACK ICON
   ========================================================= */

function createFallbackIcon(
    parent,
    gameName
) {

    /*
     * Don't create two fallback icons.
     */

    if (
        parent.querySelector(
            ".game-icon-fallback"
        )
    ) {
        return;
    }


    const fallback =
        document.createElement("div");


    fallback.className =
        "game-icon-fallback";


    /*
     * Find the first usable character.
     */

    const firstCharacter =
        String(gameName || "S")
            .trim()
            .charAt(0)
            .toUpperCase();


    fallback.textContent =
        firstCharacter || "S";


    parent.appendChild(
        fallback
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

gameSearch.addEventListener(
    "input",
    () => {

        renderGames();

    }
);


/* =========================================================
   SORT
   ========================================================= */

gameSort.addEventListener(
    "change",
    () => {

        renderGames();

    }
);


/* =========================================================
   CLEAR SEARCH
   ========================================================= */

clearSearch.addEventListener(
    "click",
    () => {

        gameSearch.value = "";

        gameSearch.focus();

        renderGames();

    }
);


/* =========================================================
   KEYBOARD SHORTCUT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         * Cmd/Ctrl + K
         */

        if (
            (event.metaKey ||
                event.ctrlKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            gameSearch.focus();

            gameSearch.select();

        }


        /*
         * Escape clears search.
         */

        if (
            event.key === "Escape" &&
            document.activeElement === gameSearch
        ) {

            gameSearch.value = "";

            renderGames();

        }

    }
);


/* =========================================================
   START
   ========================================================= */

loadGames();
```
