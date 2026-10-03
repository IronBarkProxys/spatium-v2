"use strict";


/* =========================================
   ELEMENTS
========================================= */

const gameGrid =
    document.getElementById("game-grid");

const gameSearch =
    document.getElementById("game-search");

const gameSort =
    document.getElementById("game-sort");

const gameCount =
    document.getElementById("game-count");

const emptyState =
    document.getElementById("empty-state");

const errorState =
    document.getElementById("error-state");

const clearSearch =
    document.getElementById("clear-search");

const loading =
    document.getElementById("loading");

const currentYear =
    document.getElementById("current-year");


/* =========================================
   STATE
========================================= */

let games = [];


/* =========================================
   YEAR
========================================= */

if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}


/* =========================================
   LOAD GAMES
========================================= */

async function loadGames() {

    try {

        hideError();

        showLoading();


        const response =
            await fetch(
                "./games/games.json",
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not load games.json"
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "games.json must contain an array"
            );

        }


        /*
         * games.json can contain:
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


        games =
            data.map(
                (game) => {

                    if (
                        typeof game ===
                        "string"
                    ) {

                        return {
                            slug: game,
                            name: game,
                            description: "",
                            category: "Game",
                            icon:
                                "./assets/game-icons/"
                                +
                                game
                                    .toLowerCase()
                                    .replace(
                                        /[^a-z0-9]+/g,
                                        "-"
                                    )
                                    .replace(
                                        /^-|-$/g,
                                        ""
                                    )
                                +
                                ".svg"
                        };

                    }


                    return {
                        slug:
                            game.slug || "",

                        name:
                            game.name ||
                            game.slug ||
                            "Unnamed Game",

                        description:
                            game.description ||
                            "",

                        category:
                            game.category ||
                            "Game",

                        icon:
                            game.icon ||
                            (
                                "./assets/game-icons/"
                                +
                                String(
                                    game.slug || ""
                                )
                                    .toLowerCase()
                                    .replace(
                                        /[^a-z0-9]+/g,
                                        "-"
                                    )
                                    .replace(
                                        /^-|-$/g,
                                        ""
                                    )
                                +
                                ".svg"
                            )
                    };

                }
            );


        /*
         * Remove invalid entries.
         */

        games =
            games.filter(
                game =>
                    game.slug &&
                    game.name
            );


        hideLoading();

        renderGames();


    } catch (error) {

        console.error(
            "[Spatium Games]",
            error
        );

        hideLoading();

        showError();

        if (gameCount) {
            gameCount.textContent =
                "Unable to load";
        }

    }

}


/* =========================================
   RENDER
========================================= */

function renderGames() {

    if (!gameGrid) {
        return;
    }


    const search =
        gameSearch
            ? gameSearch.value
                .trim()
                .toLowerCase()
            : "";


    let filtered =
        games.filter(
            game => {

                const name =
                    String(
                        game.name || ""
                    ).toLowerCase();

                const description =
                    String(
                        game.description || ""
                    ).toLowerCase();

                const category =
                    String(
                        game.category || ""
                    ).toLowerCase();


                return (
                    name.includes(search) ||
                    description.includes(search) ||
                    category.includes(search)
                );

            }
        );


    /*
     * Sort
     */

    if (
        gameSort &&
        gameSort.value === "za"
    ) {

        filtered.sort(
            (a, b) =>
                b.name.localeCompare(
                    a.name
                )
        );

    } else {

        filtered.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

    }


    /*
     * Clear old cards
     */

    gameGrid.innerHTML = "";


    /*
     * Update count
     */

    if (gameCount) {

        gameCount.textContent =
            filtered.length +
            (
                filtered.length === 1
                    ? " game"
                    : " games"
            );

    }


    /*
     * Empty state
     */

    if (
        filtered.length === 0
    ) {

        if (emptyState) {
            emptyState.classList.add(
                "show"
            );
        }

        return;

    }


    if (emptyState) {
        emptyState.classList.remove(
            "show"
        );
    }


    /*
     * Create cards
     */

    filtered.forEach(
        game => {

            const card =
                createGameCard(game);

            gameGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================
   CREATE GAME CARD
========================================= */

function createGameCard(game) {

    const card =
        document.createElement("a");


    card.className =
        "game-card";


    /*
     * Game URL
     *
     * Example:
     *
     * games/slope/
     */

    card.href =
        "./games/" +
        encodeURIComponent(
            game.slug
        ) +
        "/";


    /*
     * IMAGE
     */

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "game-card-image";


    const image =
        document.createElement("img");


    image.src =
        game.icon;


    image.alt =
        game.name;


    image.loading =
        "lazy";


    image.onerror =
        function () {

            image.style.display =
                "none";


            const fallback =
                document.createElement(
                    "div"
                );


            fallback.className =
                "game-icon-fallback";


            fallback.textContent =
                game.name
                    .charAt(0)
                    .toUpperCase();


            imageContainer.appendChild(
                fallback
            );

        };


    imageContainer.appendChild(
        image
    );


    /*
     * CONTENT
     */

    const content =
        document.createElement("div");

    content.className =
        "game-card-content";


    const title =
        document.createElement("div");

    title.className =
        "game-card-title";

    title.textContent =
        game.name;


    content.appendChild(
        title
    );


    if (
        game.description
    ) {

        const description =
            document.createElement(
                "div"
            );

        description.className =
            "game-card-description";

        description.textContent =
            game.description;

        content.appendChild(
            description
        );

    }


    if (
        game.category
    ) {

        const category =
            document.createElement(
                "span"
            );

        category.className =
            "game-card-category";

        category.textContent =
            game.category;

        content.appendChild(
            category
        );

    }


    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );


    return card;

}


/* =========================================
   SEARCH
========================================= */

if (gameSearch) {

    gameSearch.addEventListener(
        "input",
        function () {

            renderGames();

        }
    );

}


/* =========================================
   SORT
========================================= */

if (gameSort) {

    gameSort.addEventListener(
        "change",
        function () {

            renderGames();

        }
    );

}


/* =========================================
   CLEAR SEARCH
========================================= */

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        function () {

            if (gameSearch) {

                gameSearch.value =
                    "";

                gameSearch.focus();

            }

            renderGames();

        }
    );

}


/* =========================================
   KEYBOARD SHORTCUT
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        /*
         * Cmd + K / Ctrl + K
         */

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            if (gameSearch) {
                gameSearch.focus();
            }

        }


        /*
         * Escape clears search
         */

        if (
            event.key === "Escape" &&
            document.activeElement ===
                gameSearch
        ) {

            if (gameSearch) {

                gameSearch.value =
                    "";

                renderGames();

            }

        }

    }
);


/* =========================================
   LOADING HELPERS
========================================= */

function showLoading() {

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }

    if (gameGrid) {
        gameGrid.innerHTML = "";
    }

}


function hideLoading() {

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}


/* =========================================
   ERROR HELPERS
========================================= */

function showError() {

    if (errorState) {

        errorState.classList.add(
            "show"
        );

    }

}


function hideError() {

    if (errorState) {

        errorState.classList.remove(
            "show"
        );

    }

}


/* =========================================
   START
========================================= */

loadGames();
