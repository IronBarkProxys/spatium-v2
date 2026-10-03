/* =========================================================
   SPATIUM · GAMEVAULT
   games.js
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const GAMES_JSON = "./games.json";

/*
    Change this ONE value if your game folders are stored
    somewhere else.

    Current expected structure:

    Games/
        1v1.lol/
        2048/
        Among-Us/
        ...

    Each folder should contain the game's index.html.
*/
const GAME_BASE_PATH = "./Games/";


/* =========================================================
   STATE
========================================================= */

let allGames = [];

let currentGames = [];

let currentFilter = "all";

let currentSearch = "";

let currentSort = "featured";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const gamesContainer = document.getElementById("games");

const loadingState = document.getElementById("loadingState");

const noResults = document.getElementById("noResults");

const resultCount = document.getElementById("resultCount");

const gameSearch = document.getElementById("gameSearch");

const globalSearch = document.getElementById("globalSearch");

const clearSearch = document.getElementById("clearSearch");

const sortGames = document.getElementById("sortGames");

const resetFilters = document.getElementById("resetFilters");

const randomGameButton = document.getElementById("randomGameButton");

const randomGameButtonLarge =
    document.getElementById("randomGameButtonLarge");

const filterButtons =
    document.querySelectorAll(".filter-button");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");

const closeMobileMenu =
    document.getElementById("closeMobileMenu");

const mobileMenuOverlay =
    document.getElementById("mobileMenuOverlay");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupEventListeners();

    loadGames();

});


/* =========================================================
   LOAD GAMES.JSON
========================================================= */

async function loadGames() {

    showLoading();

    try {

        const response = await fetch(
            `${GAMES_JSON}?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                `Unable to load games.json (${response.status})`
            );

        }

        const data = await response.json();

        if (!data || !Array.isArray(data.games)) {

            throw new Error(
                "games.json must contain a games array."
            );

        }

        allGames = data.games
            .filter(game => game && game.name)
            .map(normalizeGame);

        currentGames = [...allGames];

        hideLoading();

        renderGames();

    } catch (error) {

        console.error("GameVault error:", error);

        hideLoading();

        showLoadError();

    }

}


/* =========================================================
   NORMALIZE GAME DATA
========================================================= */

function normalizeGame(game) {

    return {

        name: String(game.name || "").trim(),

        folder: String(
            game.folder || game.name || ""
        ).trim(),

        thumbnail: String(
            game.thumbnail || ""
        ).trim(),

        featured: game.featured === true,

        category: Array.isArray(game.category)
            ? game.category.map(item =>
                String(item).toLowerCase()
            )
            : [],

        status: game.status
            ? String(game.status).toLowerCase()
            : "",

        reason: game.reason
            ? String(game.reason)
            : "",

        updated: game.updated
            ? String(game.updated)
            : ""

    };

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupEventListeners() {


    /* ---------------------------------------------
       GAME SEARCH
    --------------------------------------------- */

    if (gameSearch) {

        gameSearch.addEventListener("input", () => {

            currentSearch =
                gameSearch.value.trim().toLowerCase();

            updateSearchButton();

            renderGames();

        });

    }


    /* ---------------------------------------------
       GLOBAL SEARCH
    --------------------------------------------- */

    if (globalSearch) {

        globalSearch.addEventListener("input", () => {

            const value =
                globalSearch.value.trim();

            if (gameSearch) {

                gameSearch.value = value;

            }

            currentSearch =
                value.toLowerCase();

            updateSearchButton();

            renderGames();

        });


        globalSearch.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                if (gameSearch) {

                    gameSearch.focus();

                    gameSearch.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }

        });

    }


    /* ---------------------------------------------
       CLEAR SEARCH
    --------------------------------------------- */

    if (clearSearch) {

        clearSearch.addEventListener("click", () => {

            clearAllSearch();

        });

    }


    /* ---------------------------------------------
       FILTER BUTTONS
    --------------------------------------------- */

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentFilter =
                button.dataset.filter || "all";

            renderGames();

        });

    });


    /* ---------------------------------------------
       SORT
    --------------------------------------------- */

    if (sortGames) {

        sortGames.addEventListener("change", () => {

            currentSort = sortGames.value;

            renderGames();

        });

    }


    /* ---------------------------------------------
       RANDOM GAME
    --------------------------------------------- */

    if (randomGameButton) {

        randomGameButton.addEventListener(
            "click",
            launchRandomGame
        );

    }

    if (randomGameButtonLarge) {

        randomGameButtonLarge.addEventListener(
            "click",
            launchRandomGame
        );

    }


    /* ---------------------------------------------
       RESET
    --------------------------------------------- */

    if (resetFilters) {

        resetFilters.addEventListener("click", () => {

            resetAllFilters();

        });

    }


    /* ---------------------------------------------
       MOBILE MENU
    --------------------------------------------- */

    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            openMobileMenu
        );

    }

    if (closeMobileMenu) {

        closeMobileMenu.addEventListener(
            "click",
            closeMenu
        );

    }

    if (mobileMenuOverlay) {

        mobileMenuOverlay.addEventListener(
            "click",
            closeMenu
        );

    }


    /* ---------------------------------------------
       KEYBOARD SHORTCUT
    --------------------------------------------- */

    document.addEventListener("keydown", event => {

        const modifier =
            event.ctrlKey || event.metaKey;

        if (modifier && event.key.toLowerCase() === "k") {

            event.preventDefault();

            if (gameSearch) {

                gameSearch.focus();

                gameSearch.select();

            }

        }


        if (event.key === "Escape") {

            closeMenu();

        }

    });

}


/* =========================================================
   FILTER GAMES
========================================================= */

function getFilteredGames() {

    let games = [...allGames];


    /* ---------------------------------------------
       SEARCH
    --------------------------------------------- */

    if (currentSearch) {

        games = games.filter(game => {

            const name =
                game.name.toLowerCase();

            const folder =
                game.folder.toLowerCase();

            const categories =
                game.category.join(" ").toLowerCase();

            return (
                name.includes(currentSearch) ||
                folder.includes(currentSearch) ||
                categories.includes(currentSearch)
            );

        });

    }


    /* ---------------------------------------------
       CATEGORY FILTER
    --------------------------------------------- */

    if (currentFilter !== "all") {

        games = games.filter(game => {

            return gameMatchesFilter(
                game,
                currentFilter
            );

        });

    }


    /* ---------------------------------------------
       SORT
    --------------------------------------------- */

    games.sort((a, b) => {

        if (currentSort === "az") {

            return a.name.localeCompare(
                b.name,
                undefined,
                {
                    sensitivity: "base"
                }
            );

        }

        if (currentSort === "za") {

            return b.name.localeCompare(
                a.name,
                undefined,
                {
                    sensitivity: "base"
                }
            );

        }


        /* Featured */

        if (a.featured && !b.featured) {
            return -1;
        }

        if (!a.featured && b.featured) {
            return 1;
        }

        return a.name.localeCompare(
            b.name,
            undefined,
            {
                sensitivity: "base"
            }
        );

    });


    return games;

}


/* =========================================================
   CATEGORY MATCHING
========================================================= */

function gameMatchesFilter(game, filter) {

    const name =
        game.name.toLowerCase();

    const folder =
        game.folder.toLowerCase();

    const categories =
        game.category.join(" ").toLowerCase();


    if (
        game.category.includes(filter) ||
        categories.includes(filter)
    ) {

        return true;

    }


    const combined =
        `${name} ${folder}`;


    switch (filter) {

        case "racing":

            return [
                "drift",
                "race",
                "racing",
                "moto",
                "car",
                "road",
                "stunt",
                "slope",
                "snow rider"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "shooter":

            return [
                "shooter",
                "shootout",
                "sniper",
                "bank robbery",
                "bowmasters",
                "trigger",
                "archers",
                "hit"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "sports":

            return [
                "basket",
                "baseball",
                "football",
                "soccer",
                "sports",
                "retro bowl",
                "yoked"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "horror":

            return [
                "horror",
                "freddy",
                "fnaf",
                "fears to fathom",
                "bad parenting",
                "epstein"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "puzzle":

            return [
                "2048",
                "block blast",
                "cookie clicker",
                "core ball",
                "cupcakes",
                "craft",
                "merge",
                "suika",
                "plinko"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "multiplayer":

            return [
                "multiplayer",
                "online",
                "1v1",
                "among us",
                "agar",
                "slither",
                "basket bros",
                "mario vs luigi",
                "tag",
                "hide-n-seek"
            ].some(keyword =>
                combined.includes(keyword)
            );


        case "idle":

            return [
                "idle",
                "capitalist",
                "cookie clicker",
                "mage tower",
                "black hole",
                "clicker"
            ].some(keyword =>
                combined.includes(keyword)
            );


        default:

            return false;

    }

}


/* =========================================================
   RENDER GAMES
========================================================= */

function renderGames() {

    if (!gamesContainer) {
        return;
    }

    const games =
        getFilteredGames();

    currentGames = games;


    gamesContainer.innerHTML = "";


    /* ---------------------------------------------
       RESULT COUNT
    --------------------------------------------- */

    updateResultCount(games.length);


    /* ---------------------------------------------
       NO RESULTS
    --------------------------------------------- */

    if (games.length === 0) {

        gamesContainer.style.display = "none";

        if (noResults) {
            noResults.hidden = false;
        }

        return;

    }


    gamesContainer.style.display = "grid";

    if (noResults) {
        noResults.hidden = true;
    }


    /* ---------------------------------------------
       CREATE CARDS
    --------------------------------------------- */

    const fragment =
        document.createDocumentFragment();

    games.forEach(game => {

        const card =
            createGameCard(game);

        fragment.appendChild(card);

    });

    gamesContainer.appendChild(fragment);

}


/* =========================================================
   CREATE GAME CARD
========================================================= */

function createGameCard(game) {

    const article =
        document.createElement("article");

    article.className = "gameitem";


    /* ---------------------------------------------
       LINK
    --------------------------------------------- */

    const link =
        document.createElement("a");

    link.href =
        getGameUrl(game);

    link.setAttribute(
        "aria-label",
        `Play ${game.name}`
    );


    /* ---------------------------------------------
       THUMBNAIL
    --------------------------------------------- */

    if (game.thumbnail) {

        const image =
            document.createElement("img");

        image.className = "gamecover";

        image.src = game.thumbnail;

        image.alt = game.name;

        image.loading = "lazy";

        image.decoding = "async";

        image.addEventListener(
            "error",
            () => {

                image.remove();

                createPlaceholder(
                    link,
                    game.name
                );

            },
            {
                once: true
            }
        );

        link.appendChild(image);

    } else {

        createPlaceholder(
            link,
            game.name
        );

    }


    /* ---------------------------------------------
       FEATURED BADGE
    --------------------------------------------- */

    if (game.featured) {

        const badge =
            document.createElement("div");

        badge.className =
            "featured-badge";

        badge.innerHTML = `
            <span class="material-icons">star</span>
            Featured
        `;

        link.appendChild(badge);

    }


    /* ---------------------------------------------
       PLAY BUTTON
    --------------------------------------------- */

    const hover =
        document.createElement("div");

    hover.className =
        "game-hover";

    const play =
        document.createElement("div");

    play.className =
        "play-circle";

    play.innerHTML = `
        <span class="material-icons">
            play_arrow
        </span>
    `;

    hover.appendChild(play);

    link.appendChild(hover);


    /* ---------------------------------------------
       GAME NAME
    --------------------------------------------- */

    const title =
        document.createElement("div");

    title.className =
        "gametextover";

    title.textContent =
        game.name;

    link.appendChild(title);


    /* ---------------------------------------------
       APPEND
    --------------------------------------------- */

    article.appendChild(link);

    return article;

}


/* =========================================================
   PLACEHOLDER
========================================================= */

function createPlaceholder(
    parent,
    gameName
) {

    const placeholder =
        document.createElement("div");

    placeholder.className =
        "game-placeholder";

    placeholder.innerHTML = `
        <div>
            <div class="game-placeholder-icon">
                <span class="material-icons">
                    sports_esports
                </span>
            </div>

            <div class="game-placeholder-name">
                ${escapeHtml(gameName)}
            </div>
        </div>
    `;

    parent.appendChild(placeholder);

}


/* =========================================================
   GET GAME URL
========================================================= */

function getGameUrl(game) {

    /*
        Example:

        folder = "1v1.lol"

        becomes:

        ./Games/1v1.lol/
    */

    const folder =
        String(game.folder || game.name || "")
            .trim()
            .replace(/^\/+|\/+$/g, "");

    return (
        GAME_BASE_PATH +
        encodeURIComponent(folder) +
        "/"
    );

}


/* =========================================================
   RANDOM GAME
========================================================= */

function launchRandomGame() {

    if (!allGames.length) {
        return;
    }

    let pool =
        currentGames.length
            ? currentGames
            : allGames;


    /*
        Pick a random game.
    */

    const randomIndex =
        Math.floor(
            Math.random() * pool.length
        );

    const randomGame =
        pool[randomIndex];


    if (!randomGame) {
        return;
    }


    window.location.href =
        getGameUrl(randomGame);

}


/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount(count) {

    if (!resultCount) {
        return;
    }

    const total =
        allGames.length;

    if (currentSearch || currentFilter !== "all") {

        resultCount.textContent =
            `${count} of ${total} games`;

        return;

    }

    resultCount.textContent =
        `${total} games`;

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

function updateSearchButton() {

    if (!clearSearch) {
        return;
    }

    if (currentSearch) {

        clearSearch.classList.add(
            "visible"
        );

    } else {

        clearSearch.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function clearAllSearch() {

    currentSearch = "";

    if (gameSearch) {
        gameSearch.value = "";
    }

    if (globalSearch) {
        globalSearch.value = "";
    }

    updateSearchButton();

    renderGames();

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetAllFilters() {

    currentSearch = "";

    currentFilter = "all";

    currentSort = "featured";


    if (gameSearch) {
        gameSearch.value = "";
    }

    if (globalSearch) {
        globalSearch.value = "";
    }

    if (sortGames) {
        sortGames.value = "featured";
    }


    filterButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === "all"
        );

    });


    updateSearchButton();

    renderGames();

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    if (loadingState) {

        loadingState.style.display =
            "flex";

    }

    if (gamesContainer) {

        gamesContainer.style.display =
            "none";

    }

    if (noResults) {

        noResults.hidden = true;

    }

}


function hideLoading() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }

}


/* =========================================================
   LOAD ERROR
========================================================= */

function showLoadError() {

    if (!gamesContainer) {
        return;
    }

    gamesContainer.style.display =
        "none";


    if (noResults) {

        noResults.hidden = false;

        const heading =
            noResults.querySelector("h3");

        const text =
            noResults.querySelector("p");

        const button =
            noResults.querySelector("button");


        if (heading) {

            heading.textContent =
                "Games could not be loaded";

        }

        if (text) {

            text.textContent =
                "Make sure games.json exists next to games.html.";

        }

        if (button) {

            button.style.display =
                "none";

        }

    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function openMobileMenu() {

    if (mobileMenu) {

        mobileMenu.classList.add("open");

    }

    if (mobileMenuOverlay) {

        mobileMenuOverlay.classList.add("open");

    }

    document.body.style.overflow =
        "hidden";

}


function closeMenu() {

    if (mobileMenu) {

        mobileMenu.classList.remove("open");

    }

    if (mobileMenuOverlay) {

        mobileMenuOverlay.classList.remove("open");

    }

    document.body.style.overflow =
        "";

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   QUERY STRING SEARCH
========================================================= */

function loadSearchFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const search =
        params.get("search");

    if (!search) {
        return;
    }

    currentSearch =
        search.trim().toLowerCase();


    if (gameSearch) {

        gameSearch.value =
            search;

    }

    if (globalSearch) {

        globalSearch.value =
            search;

    }

    updateSearchButton();

}


/* =========================================================
   APPLY URL SEARCH AFTER LOAD
========================================================= */

const originalLoadGames =
    loadGames;


/*
    Wait until the JSON has loaded,
    then apply ?search=...
*/

async function initializeUrlSearch() {

    loadSearchFromUrl();

}


/* =========================================================
   WINDOW LOAD
========================================================= */

window.addEventListener(
    "load",
    () => {

        loadSearchFromUrl();

        if (currentSearch) {

            renderGames();

        }

    }
);
