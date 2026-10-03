(() => {
    "use strict";

    const HUD_CONFIG = {
        gamesJson: "../../games.json",
        gamesPage: "../../games.html",
        defaultTitle: "Game",
        reportEmail: "support@example.com"
    };

    const style = document.createElement("style");

    style.textContent = `
        #hud-wrap {
            position: fixed;
            left: 50%;
            bottom: 12px;
            transform: translateX(-50%);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            padding: 5px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 16px;
            background: rgba(0,0,0,.78);
            box-shadow: 0 8px 28px rgba(0,0,0,.45);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            font-family: Arial, sans-serif;
        }

        .spatium-hud-pill {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .hud-btn {
            width: 32px;
            height: 32px;
            padding: 0;
            border: 0;
            border-radius: 10px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.07);
            color: #fff;
            cursor: pointer;
            transition:
                background .15s ease,
                transform .15s ease;
        }

        .hud-btn:hover {
            background: rgba(255,255,255,.15);
            transform: translateY(-1px);
        }

        .hud-btn:active {
            transform: scale(.92);
        }

        .hud-btn .material-icons {
            font-size: 17px;
            line-height: 1;
        }

        .hud-game {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
        }

        #hud-cover {
            width: 28px;
            height: 28px;
            object-fit: cover;
            border-radius: 8px;
            background: #171717;
        }

        #game-name {
            display: none;
        }

        .hud-divider {
            width: 1px;
            height: 20px;
            margin: 0 2px;
            background: rgba(255,255,255,.10);
        }

        .hud-toggle {
            position: fixed;
            right: 12px;
            bottom: 12px;
            z-index: 2147483647;
            width: 36px;
            height: 36px;
            padding: 0;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 12px;
            display: none;
            place-items: center;
            background: rgba(0,0,0,.78);
            color: #fff;
            box-shadow: 0 8px 25px rgba(0,0,0,.4);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            cursor: pointer;
        }

        .hud-toggle:hover {
            background: rgba(0,0,0,.9);
        }

        .hud-toggle .material-icons {
            font-size: 19px;
        }

        .hud-help-modal {
            position: fixed;
            inset: 0;
            z-index: 2147483646;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.58);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }

        .hud-help-modal.active {
            display: flex;
        }

        .hud-help-box {
            width: min(380px, 100%);
            padding: 18px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 18px;
            background: rgba(0,0,0,.92);
            color: #fff;
            box-shadow: 0 20px 60px rgba(0,0,0,.55);
        }

        .hud-help-box h2 {
            margin: 0 0 8px;
            font-size: 17px;
        }

        .hud-help-box p {
            margin: 0;
            color: rgba(255,255,255,.65);
            font-size: 13px;
            line-height: 1.5;
        }

        .hud-help-close {
            width: 100%;
            height: 34px;
            margin-top: 14px;
            border: 0;
            border-radius: 10px;
            background: rgba(255,255,255,.08);
            color: #fff;
            cursor: pointer;
        }

        .hud-help-close:hover {
            background: rgba(255,255,255,.14);
        }

        #hud-wrap.hud-hidden {
            display: none;
        }

        @media (max-width: 600px) {
            #hud-wrap {
                bottom: 8px;
                padding: 4px;
                border-radius: 14px;
            }

            .spatium-hud-pill {
                gap: 3px;
            }

            .hud-btn {
                width: 30px;
                height: 30px;
                border-radius: 9px;
            }

            .hud-btn .material-icons {
                font-size: 16px;
            }

            #hud-cover {
                width: 26px;
                height: 26px;
                border-radius: 7px;
            }

            .hud-divider {
                height: 18px;
                margin: 0 1px;
            }
        }
    `;

    document.head.appendChild(style);

    function getCurrentGameFolder() {
        const parts = window.location.pathname
            .split("/")
            .filter(Boolean);

        const gamesIndex = parts.findIndex(
            part => part.toLowerCase() === "games"
        );

        if (
            gamesIndex !== -1 &&
            parts[gamesIndex + 1]
        ) {
            return decodeURIComponent(
                parts[gamesIndex + 1]
            );
        }

        return "Game";
    }

    function getGameElement() {
        return (
            document.querySelector("#gameFrame") ||
            document.querySelector("#game-iframe") ||
            document.querySelector("iframe") ||
            document.querySelector("#gameContainer") ||
            document.querySelector(".webgl-content") ||
            document.querySelector("#game-container") ||
            document.querySelector("canvas") ||
            document.documentElement
        );
    }

    async function loadGameInfo() {
        const folder = getCurrentGameFolder();

        try {
            const response = await fetch(
                HUD_CONFIG.gamesJson +
                "?t=" +
                Date.now()
            );

            if (!response.ok) {
                throw new Error("games.json failed");
            }

            const data = await response.json();

            const games = Array.isArray(data)
                ? data
                : Array.isArray(data.games)
                    ? data.games
                    : [];

            const game = games.find(item => {
                const itemFolder =
                    String(item.folder || "")
                        .toLowerCase();

                const itemName =
                    String(item.name || "")
                        .toLowerCase();

                const current =
                    folder.toLowerCase();

                return (
                    itemFolder === current ||
                    itemName === current
                );
            });

            if (game) {
                return {
                    name:
                        game.name ||
                        game.folder ||
                        folder,
                    cover:
                        game.thumbnail ||
                        ""
                };
            }
        } catch (error) {
            console.warn(
                "[Spatium HUD] games.json unavailable",
                error
            );
        }

        return {
            name:
                folder ||
                HUD_CONFIG.defaultTitle,
            cover: ""
        };
    }

    function createHud(gameInfo) {
        if (document.getElementById("hud-wrap")) {
            return;
        }

        const hud = document.createElement("div");

        hud.id = "hud-wrap";

        hud.innerHTML = `
            <div class="spatium-hud-pill">

                <button
                    class="hud-btn"
                    id="hud-back"
                    type="button"
                    aria-label="Back"
                    title="Back"
                >
                    <span class="material-icons">
                        arrow_back
                    </span>
                </button>

                <div class="hud-divider"></div>

                <div class="hud-game">
                    <img
                        id="hud-cover"
                        alt=""
                    >
                </div>

                <div class="hud-divider"></div>

                <button
                    class="hud-btn"
                    id="hud-fullscreen"
                    type="button"
                    aria-label="Fullscreen"
                    title="Fullscreen"
                >
                    <span class="material-icons">
                        fullscreen
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-report"
                    type="button"
                    aria-label="Report"
                    title="Report"
                >
                    <span class="material-icons">
                        flag
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-help"
                    type="button"
                    aria-label="Help"
                    title="Help"
                >
                    <span class="material-icons">
                        help_outline
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-touch"
                    type="button"
                    aria-label="Touch controls"
                    title="Touch controls"
                >
                    <span class="material-icons">
                        touch_app
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-settings"
                    type="button"
                    aria-label="Settings"
                    title="Settings"
                >
                    <span class="material-icons">
                        settings
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-hide"
                    type="button"
                    aria-label="Hide HUD"
                    title="Hide HUD"
                >
                    <span class="material-icons">
                        expand_more
                    </span>
                </button>

            </div>
        `;

        document.body.appendChild(hud);

        const cover =
            document.getElementById("hud-cover");

        if (gameInfo.cover) {
            cover.src = gameInfo.cover;

            cover.onerror = () => {
                cover.style.display = "none";
            };
        } else {
            cover.style.display = "none";
        }

        createToggle();
        createHelpModal();
        setupEvents();
    }

    function createToggle() {
        const toggle =
            document.createElement("button");

        toggle.className = "hud-toggle";
        toggle.id = "hud-toggle";
        toggle.type = "button";
        toggle.setAttribute(
            "aria-label",
            "Show controls"
        );
        toggle.title = "Show controls";

        toggle.innerHTML = `
            <span class="material-icons">
                expand_less
            </span>
        `;

        document.body.appendChild(toggle);

        toggle.addEventListener(
            "click",
            toggleHud
        );
    }

    function createHelpModal() {
        const modal =
            document.createElement("div");

        modal.className = "hud-help-modal";
        modal.id = "hud-help-modal";

        modal.innerHTML = `
            <div
                class="hud-help-box"
                role="dialog"
                aria-modal="true"
            >
                <h2>Game Help</h2>

                <p>
                    Use the game's normal controls
                    to play. The HUD provides quick
                    access to fullscreen, settings,
                    touch controls, and navigation.
                </p>

                <button
                    class="hud-help-close"
                    id="hud-help-close"
                    type="button"
                >
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("hud-help-close")
            .addEventListener(
                "click",
                toggleHelpWindow
            );

        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    toggleHelpWindow();
                }
            }
        );
    }

    function setupEvents() {
        document
            .getElementById("hud-back")
            .addEventListener(
                "click",
                Backhome
            );

        document
            .getElementById("hud-fullscreen")
            .addEventListener(
                "click",
                ToggleFullscreen
            );

        document
            .getElementById("hud-report")
            .addEventListener(
                "click",
                reportIssue
            );

        document
            .getElementById("hud-help")
            .addEventListener(
                "click",
                toggleHelpWindow
            );

        document
            .getElementById("hud-touch")
            .addEventListener(
                "click",
                toggleControllerSettings
            );

        document
            .getElementById("hud-settings")
            .addEventListener(
                "click",
                toggleControllerSettings
            );

        document
            .getElementById("hud-hide")
            .addEventListener(
                "click",
                toggleHud
            );
    }

    function Backhome() {
        window.location.href =
            HUD_CONFIG.gamesPage;
    }

    async function ToggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                updateFullscreenIcon();
                return;
            }

            const target = getGameElement();

            if (
                target &&
                target.requestFullscreen
            ) {
                await target.requestFullscreen();
            } else {
                await document.documentElement
                    .requestFullscreen();
            }

            updateFullscreenIcon();
        } catch (error) {
            console.warn(
                "[Spatium HUD] Fullscreen failed",
                error
            );
        }
    }

    function updateFullscreenIcon() {
        const button =
            document.getElementById(
                "hud-fullscreen"
            );

        if (!button) {
            return;
        }

        const icon =
            button.querySelector(
                ".material-icons"
            );

        if (!icon) {
            return;
        }

        icon.textContent =
            document.fullscreenElement
                ? "fullscreen_exit"
                : "fullscreen";
    }

    document.addEventListener(
        "fullscreenchange",
        updateFullscreenIcon
    );

    function toggleHud() {
        const hud =
            document.getElementById(
                "hud-wrap"
            );

        const toggle =
            document.getElementById(
                "hud-toggle"
            );

        if (!hud || !toggle) {
            return;
        }

        const hidden =
            hud.classList.toggle(
                "hud-hidden"
            );

        toggle.style.display =
            hidden ? "grid" : "none";
    }

    function toggleHelpWindow() {
        const modal =
            document.getElementById(
                "hud-help-modal"
            );

        if (!modal) {
            return;
        }

        modal.classList.toggle("active");
    }

    function reportIssue() {
        const gameName =
            getCurrentGameFolder();

        const subject =
            encodeURIComponent(
                `Game Report: ${gameName}`
            );

        const body =
            encodeURIComponent(
                `Game: ${gameName}\n\nIssue:\n\n`
            );

        window.location.href =
            `mailto:${HUD_CONFIG.reportEmail}` +
            `?subject=${subject}&body=${body}`;
    }

    function toggleControllerSettings() {
        const game =
            getGameElement();

        if (
            game &&
            typeof game.toggleTouchControls ===
                "function"
        ) {
            game.toggleTouchControls();
            return;
        }

        window.dispatchEvent(
            new CustomEvent(
                "spatium:toggle-touch-controls"
            )
        );
    }

    window.Backhome = Backhome;
    window.ToggleFullscreen =
        ToggleFullscreen;
    window.toggleHud = toggleHud;
    window.toggleHelpWindow =
        toggleHelpWindow;
    window.reportIssue = reportIssue;
    window.toggleControllerSettings =
        toggleControllerSettings;

    async function init() {
        if (
            document.readyState ===
            "loading"
        ) {
            await new Promise(resolve => {
                document.addEventListener(
                    "DOMContentLoaded",
                    resolve,
                    { once: true }
                );
            });
        }

        const gameInfo =
            await loadGameInfo();

        createHud(gameInfo);
    }

    init();
})();
