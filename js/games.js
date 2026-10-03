(() => {
    "use strict";

    const GAMES_JSON = "./games.json";

    const grid = document.getElementById("gamesGrid");
    const searchInput = document.getElementById("gameSearch");
    const clearSearch = document.getElementById("clearSearch");
    const gameCount = document.getElementById("gameCount");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");
    const retryButton = document.getElementById("retryButton");

    let games = [];


    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .trim();
    }


    function safeId(value) {
        return String(value || "game")
            .replace(/[^A-Za-z0-9 _.-]/g, "")
            .trim() || "game";
    }


    function getGameId(game) {
        return normalize(game.name);
    }


    function getGameUrl(game) {
        const id = getGameId(game);

        return `./Games/game.html?id=${encodeURIComponent(id)}`;
    }


    function createPlaceholder(name) {
        const placeholder = document.createElement("div");

        placeholder.className = "game-placeholder";

        placeholder.textContent = name;

        return placeholder;
    }


    function createGameCard(game, index) {

        const name =
            String(game.name || "Untitled Game").trim();

        const gameId =
            getGameId(game);


        const item =
            document.createElement("div");

        item.className =
            "gameitem is-visible";

        item.id =
            safeId(name);

        item.dataset.gameId =
            gameId;

        item.dataset.gameName =
            name;

        item.dataset.originalOrder =
            String(index);

        item.style.order =
            String(index);


        const link =
            document.createElement("a");

        link.href =
            getGameUrl(game);

        link.setAttribute(
            "aria-label",
            `Play ${name}`
        );


        const title =
            document.createElement("div");

        title.className =
            "gametextover";

        title.textContent =
            name;


        const thumbnail =
            String(game.thumbnail || "").trim();


        if (thumbnail) {

            const image =
                document.createElement("img");

            image.className =
                "gamecover";

            image.alt =
                `${name} Cover`;

            image.loading =
                "lazy";

            image.decoding =
                "async";

            image.src =
                thumbnail;


            image.addEventListener(
                "error",
                () => {
                    image.replaceWith(
                        createPlaceholder(name)
                    );
                },
                { once: true }
            );


            link.appendChild(image);

        } else {

            link.appendChild(
                createPlaceholder(name)
            );

        }


        link.appendChild(title);

        item.appendChild(link);

        return item;
    }


    function renderGames(list) {

        grid.innerHTML = "";


        if (!list.length) {

            grid.hidden = true;

            emptyState.hidden = false;

            gameCount.textContent =
                "0 games";

            return;
        }


        grid.hidden = false;

        emptyState.hidden = true;


        const fragment =
            document.createDocumentFragment();


        list.forEach(
            (game, index) => {

                fragment.appendChild(
                    createGameCard(
                        game,
                        index
                    )
                );

            }
        );


        grid.appendChild(fragment);


        if (list.length === games.length) {

            gameCount.textContent =
                `${games.length} games`;

        } else {

            gameCount.textContent =
                `${list.length} of ${games.length} games`;

        }
    }


    function filterGames() {

        const query =
            normalize(searchInput.value);


        clearSearch.style.display =
            query
                ? "block"
                : "none";


        if (!query) {

            renderGames(games);

            return;
        }


        const filtered =
            games.filter(game => {

                const name =
                    normalize(game.name);

                const folder =
                    normalize(game.folder);


                return (
                    name.includes(query) ||
                    folder.includes(query)
                );
            });


        renderGames(filtered);
    }


    async function loadGames() {

        errorState.hidden = true;

        emptyState.hidden = true;

        grid.hidden = false;

        gameCount.textContent =
            "Loading games...";


        try {

            const response =
                await fetch(
                    `${GAMES_JSON}?t=${Date.now()}`,
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {
                throw new Error(
                    `games.json returned ${response.status}`
                );
            }


            const data =
                await response.json();


            const list =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.games)
                        ? data.games
                        : [];


            games =
                list.filter(game =>
                    game &&
                    typeof game === "object" &&
                    String(game.name || "").trim()
                );


            renderGames(games);

        } catch (error) {

            console.error(
                "[Spatium] Failed to load games:",
                error
            );


            games = [];

            grid.innerHTML = "";

            grid.hidden = true;

            emptyState.hidden = true;

            errorState.hidden = false;

            gameCount.textContent =
                "Games unavailable";
        }
    }


    searchInput.addEventListener(
        "input",
        filterGames
    );


    clearSearch.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            searchInput.focus();

            filterGames();
        }
    );


    retryButton.addEventListener(
        "click",
        loadGames
    );


    loadGames();

})();
