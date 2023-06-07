const { Localize } = require("./tools/LocaleTools");
const RequestInfo = require("../middleware/RequestBlocking");
const { Log } = require("../Log");
const Head = require("./Head");

const fs = require('fs/promises');
const fsdir = require('fs');
const Markdown = require("markdown").markdown;
const Prism = require("prismjs");

require("prismjs/components/")(["cpp"]);

const AvailablePages = {
    Home: Symbol("Home"),
    Dynamic: Symbol("Article"),
    R: Symbol("R"),
    NonstandardPages: ["R"],
};
function CalculateAge() {
    var AgeDif = new Date(Date.now() - new Date(1131950100000));
    return Math.abs(AgeDif.getUTCFullYear() - 1970);
}
let Cache = [];
const GeneratePageCached = async function (
    req,
    Article,
    Locale,
    AvailablePages,
    AvailablePageSelector,
    Custom = "",
    Filename
) {
    let ServeInfo =
        " (" +
        RequestInfo.RequestAnalytics.TotalRequestsServed +
        " served, " +
        RequestInfo.RequestAnalytics.TotalRequestsBlocked +
        " blocked)";
    let CacheObject = {
        A: Article,
        B: req.header("Accept-Language"),
        C: AvailablePageSelector,
        D: Custom,
        E: Filename,
    };
    let Found = {};
    for (var x = 0; x < Cache.length; x++) {
        if (Cache[x].A == CacheObject.A) {
            if (Cache[x].B == CacheObject.B) {
                if (Cache[x].C == CacheObject.C) {
                    if (Cache[x].D == CacheObject.D) {
                        if (Cache[x].E == CacheObject.E) {
                            Found = Cache[x];
                        }
                    }
                }
            }
        }
    }
    if (Found.A == Article) {
        Log("Serve: " + req.url + ServeInfo);
        return Found.F;
    } else {
        CacheObject.F = GeneratePage(
            Article,
            Locale,
            AvailablePages,
            AvailablePageSelector,
            Custom,
            Filename
        );
        Cache.push(CacheObject);
        Log("Rendered page for cache: " + req.url + ServeInfo);
        return CacheObject.F;
    }
};

function CreateTooltips() {
    let Output = "";
    Output += "<div class='TooltipContainer MobileHidden'>";
    Output +=
        "<p id='TooltipText' class='TooltipText NoSelect' aria-hidden='true'>";
    Output += "</p>";
    Output += "</div>";
    Output += "<div class='TooltipContainer MobileHidden'>";
    Output +=
        "<p id='TooltipText2' class='TooltipText TooltipTextSmall NoSelect' aria-hidden='true'>";
    Output += "</p>";
    Output += "</div>";
    return Output;
}
const GenerateHeader = function (
    Article
) {
    return `
        <div class="Header">
            <svg class="Icon Coloring1" onclick="GoHome()" version="1.0" xmlns="http://www.w3.org/2000/svg" width="300.000000pt" height="300.000000pt" viewBox="0 0 300.000000 300.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,300.000000) scale(0.050000,-0.050000)"><path d="M2707 5344 c-178 -217 -563 -686 -857 -1043 -609 -741 -676 -830 -786 -1052 -265 -529 -186 -1034 228 -1460 114 -117 678 -590 702 -588 9 1 372 434 806 964 1176 1433 1361 1655 1376 1655 73 0 193 -307 179 -459 -16 -176 -34 -201 -1014 -1389 -506 -615 -920 -1123 -920 -1130 2 -19 587 -490 606 -487 9 1 194 217 410 480 216 263 596 725 844 1027 679 823 798 1012 870 1376 103 514 -94 878 -779 1439 l-277 227 -46 -47 c-42 -43 -814 -980 -1749 -2122 -203 -249 -380 -453 -393 -454 -40 -2 -147 163 -180 276 -75 257 -63 276 863 1400 429 521 842 1022 917 1114 75 92 131 176 124 187 -17 28 -549 463 -577 472 -13 4 -169 -169 -347 -386z"></path></g></svg>
        </div>
        <div class="Sidebar SidebarRight" id="SidebarMain">
            <a href="https://youtube.com/@shaffs" data-tooltip="YouTube"><svg class="Icon Coloring1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg></a>
        </div>
        <div class="SidebarScrollPercentage" style="background-color: rgba(255, 255, 255, 0.2);">
            <div class="SidebarScrollFill"></div>
        </div>
    `;
};
const GenerateFooter = function (
    CopyrightString
) {
    return `
        <div class="Footer2 Coloring1" style="opacity: 1">
            <svg onclick="GoDown()" xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M24 40 8 24l2.1-2.1 12.4 12.4V8h3v26.3l12.4-12.4L40 24Z"></path></svg>
        </div>
        <div class="Footer">
            <h3>` + CopyrightString + `</h3>
        </div>
    `;
};
const GenerateShareSection = function (Locale, Filename, Article) {
    let Output = `
    <div class="ShareSection">
    <p class="ShareHeader">` + Localize(Locale, "share_section_header") + `</p>
    <div class="ShareButtonContainer">
    <a aria-label="Copy Link" class="ShareItemLink" onclick="navigator.clipboard.writeText(document.URL);">
    <div class="ShareItem ShareButtonGray">
    <svg class="ShareItemInner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"></path></svg>
    </div>
    </a>
    </div>
    </div>
    <div class="ShareButtonContainer ShareMaxWidth">
    </div>
    `

    return Output;
}
const GenerateBodyV2 = async function (
    Article2,
    Locale,
    AvailablePages,
    AvailablePageSelector,
    Custom,
    Filename
) {
    let Output = "";
    switch (AvailablePageSelector) {
        case AvailablePages.Home:
            Output +=
                `
                <div class="Slide SlideVisible" id="Slide1" style="background-color: black"></div>
                <div class="Slide SlideContentVisible SlideOccluded" id="SlideContent1">
                    <div class="GradientContainer" style="filter: brightness(2)">
                        <div class="Gr Gr-1"></div>
                        <div class="Gr Gr-2"></div>
                        <div class="Gr Gr-3"></div>
                    </div>
                    <div class="SlideInner" style="color: white">
                        <p class="Author">Laksh Prasad</p>
                        <h1 class="Slide1 Slide1Visible">` + Localize(Locale, "pageTitle1") + `</h1>
                        <p class="Slide1 Slide1Visible">Hello! I'm Laksh, a <rd data-tooltipsmall="Automatically Updates">` + CalculateAge() + `-year-old</rd> young future entrepreneur (primarly trying to learn c++ and c# + reverse enginering) from New Zealand</p>
                        <br class="Slide1 Slide1Visible">
                        `

            // Index
            let Posts = []
            let indexed = [];

            let filenames = fsdir.readdirSync(__dirname.replace("generators", "posts/"));
            for (var x = 0; x < filenames.length; x++) {
                if (filenames[x].endsWith(".md")) {
                    let JSONstr = await fs.readFile(__dirname.replace("generators", "posts/") + filenames[x], { encoding: "utf-8" })
                    let Current = JSON.parse(JSONstr.split("}")[0] + "}")
                    if (Current.indexed) {
                        Posts.push({ data: Current, file: filenames[x] })
                    }
                }
            }
            Posts.sort(function (a, b) {
                const FirstDate = new Date(a.data.date)
                const SecondDate = new Date(b.data.date)

                return SecondDate - FirstDate
            })

            for (let x = 0; x < 2; x++) {
                Posts.forEach(Post => {
                    if (Post.file.endsWith(".md") && ((x == 0 && Post.data.pinned) || (x == 1 && !indexed.includes(Post.file)))) {
                        let JSON = Post.data
                        if (JSON.indexed) {
                            Output += `<div class="ArticleItem Slide1 Slide1Visible" style="margin-top: 20px">`
                            Output += `
                                            <div class="GridItem Slide1 Slide1Visible" style="padding-bottom: 0px; width: max-content; padding-right: 0px;">
                                            <a href="/` + Post.file.replace(".md", "") + `">
                                            <div style="display: flex; width: max-content">`

                            // Article Titles
                            if (x == 0) {
                                Output += `<h3 style="margin-top: 0px; text-shadow: var(--default-shadow); color: white; background-color: var(--accent-color); padding: 5px; padding-right: 7px; padding-left: 7px; width: max-content; height: max-content; margin-top: 5px;">` + JSON.title + `</h3>`
                            }
                            else {
                                Output += `<h3 style="margin-top: 5px; color: white; padding: 5px; padding-left: 0px">` + JSON.title + `</h3>`
                            }
                            Output += `<p style="font-size: 14px; margin-top: 0px; color: white; opacity: 0.5; margin: 14px; margin-left: 8px">` + JSON.date + `</p></div>`

                            // Article Descriptions
                            if (x == 0) {
                                Output += `<p style="color: white; margin: 0px; width: max-content">` + JSON.description + `</p>`
                            }
                            else {
                                Output += `<p style="color: white; margin: 0px; width: max-content; margin-top: -5px;">` + JSON.description + `</p>`
                            }

                            Output += `</a></div></div>`

                        }
                        indexed.push(Post.file)
                    }
                })
            }
            Output += "</div>"

            Output += `</div>
                </div>
                <div class="Slide SlideNotViewed" id="Slide2" style="background-color: var(--accent-color); height: 100vh;">
                    <svg viewBox="0 0 1440 260" class="MobileHidden SVGBottom" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sw-gradient-0" x1="0" x2="0" y1="1" y2="0"><stop stop-color="rgba(0, 0, 0, 0)" offset="0%"></stop><stop stop-color="var(--accent-color)" offset="100%"></stop></linearGradient></defs><path style="transform:translate(0, 0px); opacity:1" fill="url(#sw-gradient-0)" d="M0,52L60,69.3C120,87,240,121,360,138.7C480,156,600,156,720,138.7C840,121,960,87,1080,73.7C1200,61,1320,69,1440,73.7C1560,78,1680,78,1800,73.7C1920,69,2040,61,2160,65C2280,69,2400,87,2520,99.7C2640,113,2760,121,2880,134.3C3000,147,3120,165,3240,173.3C3360,182,3480,182,3600,182C3720,182,3840,182,3960,190.7C4080,199,4200,217,4320,208C4440,199,4560,165,4680,130C4800,95,4920,61,5040,69.3C5160,78,5280,130,5400,160.3C5520,191,5640,199,5760,208C5880,217,6000,225,6120,199.3C6240,173,6360,113,6480,91C6600,69,6720,87,6840,112.7C6960,139,7080,173,7200,173.3C7320,173,7440,139,7560,112.7C7680,87,7800,69,7920,60.7C8040,52,8160,52,8280,78C8400,104,8520,156,8580,182L8640,208L8640,260L8580,260C8520,260,8400,260,8280,260C8160,260,8040,260,7920,260C7800,260,7680,260,7560,260C7440,260,7320,260,7200,260C7080,260,6960,260,6840,260C6720,260,6600,260,6480,260C6360,260,6240,260,6120,260C6000,260,5880,260,5760,260C5640,260,5520,260,5400,260C5280,260,5160,260,5040,260C4920,260,4800,260,4680,260C4560,260,4440,260,4320,260C4200,260,4080,260,3960,260C3840,260,3720,260,3600,260C3480,260,3360,260,3240,260C3120,260,3000,260,2880,260C2760,260,2640,260,2520,260C2400,260,2280,260,2160,260C2040,260,1920,260,1800,260C1680,260,1560,260,1440,260C1320,260,1200,260,1080,260C960,260,840,260,720,260C600,260,480,260,360,260C240,260,120,260,60,260L0,260Z"></path></svg>
                    <svg viewBox="0 0 1440 260" class="MobileHidden SVGTop" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sw-gradient-0" x1="0" x2="0" y1="1" y2="0"><stop stop-color="rgba(0, 0, 0, 0)" offset="0%"></stop><stop stop-color="var(--accent-color)" offset="100%"></stop></linearGradient></defs><path style="transform:translate(0, 0px); opacity:1" fill="url(#sw-gradient-0)" d="M0,208L60,199.3C120,191,240,173,360,177.7C480,182,600,208,720,208C840,208,960,182,1080,151.7C1200,121,1320,87,1440,99.7C1560,113,1680,173,1800,195C1920,217,2040,199,2160,177.7C2280,156,2400,130,2520,130C2640,130,2760,156,2880,138.7C3000,121,3120,61,3240,60.7C3360,61,3480,121,3600,138.7C3720,156,3840,130,3960,117C4080,104,4200,104,4320,104C4440,104,4560,104,4680,91C4800,78,4920,52,5040,47.7C5160,43,5280,61,5400,60.7C5520,61,5640,43,5760,34.7C5880,26,6000,26,6120,56.3C6240,87,6360,147,6480,164.7C6600,182,6720,156,6840,134.3C6960,113,7080,95,7200,104C7320,113,7440,147,7560,138.7C7680,130,7800,78,7920,69.3C8040,61,8160,95,8280,95.3C8400,95,8520,61,8580,43.3L8640,26L8640,260L8580,260C8520,260,8400,260,8280,260C8160,260,8040,260,7920,260C7800,260,7680,260,7560,260C7440,260,7320,260,7200,260C7080,260,6960,260,6840,260C6720,260,6600,260,6480,260C6360,260,6240,260,6120,260C6000,260,5880,260,5760,260C5640,260,5520,260,5400,260C5280,260,5160,260,5040,260C4920,260,4800,260,4680,260C4560,260,4440,260,4320,260C4200,260,4080,260,3960,260C3840,260,3720,260,3600,260C3480,260,3360,260,3240,260C3120,260,3000,260,2880,260C2760,260,2640,260,2520,260C2400,260,2280,260,2160,260C2040,260,1920,260,1800,260C1680,260,1560,260,1440,260C1320,260,1200,260,1080,260C960,260,840,260,720,260C600,260,480,260,360,260C240,260,120,260,60,260L0,260Z"></path></svg>
                </div>
                <div class="Slide SlideContentHidden" id="SlideContent2">
                    <div class="SlideInner" style="color: white">
                        <p class="Author"><span id="Counter" style="font-weight: 800">0+</span> years <span>experience</span></p></span>
                        <h1 class="Slide2">` + Localize(Locale, "pageTitle2") + `</h1>
                        <br class="Slide2">
                        <br class="Slide2">
                        <div class="Flexbox Slide2">
                            <div class="GridItem Slide2">
                                <h3>Web Development</h3>
                                <p><strong>About me</strong> reverse engineering <strong>modern, dynamic week auth</strong> and <strong>secure, login systems</strong>.</p>
                                <div class="Icobox">
                                        <svg class="Link" style="margin-bottom: -4px; margin-left: -1px;" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 5 50 40"><path d="M22.5 34H14q-4.15 0-7.075-2.925T4 24q0-4.15 2.925-7.075T14 14h8.5v3H14q-2.9 0-4.95 2.05Q7 21.1 7 24q0 2.9 2.05 4.95Q11.1 31 14 31h8.5Zm-6.25-8.5v-3h15.5v3ZM25.5 34v-3H34q2.9 0 4.95-2.05Q41 26.9 41 24q0-2.9-2.05-4.95Q36.9 17 34 17h-8.5v-3H34q4.15 0 7.075 2.925T44 24q0 4.15-2.925 7.075T34 34Z"/></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="Slide SlideNotViewed" id="Slide3" style="background-color: black">
                    <svg viewBox="0 0 1440 260" class="MobileHidden SVGBottom" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sw-gradient-0" x1="0" x2="0" y1="1" y2="0"><stop stop-color="rgba(0, 0, 0, 0)" offset="0%"></stop><stop stop-color="var(--accent-color)" offset="100%"></stop></linearGradient></defs><path style="transform:translate(0, 0px); opacity:1" fill="url(#sw-gradient-0)" d="M0,52L60,52C120,52,240,52,360,73.7C480,95,600,139,720,160.3C840,182,960,182,1080,164.7C1200,147,1320,113,1440,104C1560,95,1680,113,1800,121.3C1920,130,2040,130,2160,121.3C2280,113,2400,95,2520,112.7C2640,130,2760,182,2880,177.7C3000,173,3120,113,3240,99.7C3360,87,3480,121,3600,130C3720,139,3840,121,3960,95.3C4080,69,4200,35,4320,26C4440,17,4560,35,4680,39C4800,43,4920,35,5040,47.7C5160,61,5280,95,5400,117C5520,139,5640,147,5760,147.3C5880,147,6000,139,6120,121.3C6240,104,6360,78,6480,56.3C6600,35,6720,17,6840,26C6960,35,7080,69,7200,108.3C7320,147,7440,191,7560,203.7C7680,217,7800,199,7920,169C8040,139,8160,95,8280,65C8400,35,8520,17,8580,8.7L8640,0L8640,260L8580,260C8520,260,8400,260,8280,260C8160,260,8040,260,7920,260C7800,260,7680,260,7560,260C7440,260,7320,260,7200,260C7080,260,6960,260,6840,260C6720,260,6600,260,6480,260C6360,260,6240,260,6120,260C6000,260,5880,260,5760,260C5640,260,5520,260,5400,260C5280,260,5160,260,5040,260C4920,260,4800,260,4680,260C4560,260,4440,260,4320,260C4200,260,4080,260,3960,260C3840,260,3720,260,3600,260C3480,260,3360,260,3240,260C3120,260,3000,260,2880,260C2760,260,2640,260,2520,260C2400,260,2280,260,2160,260C2040,260,1920,260,1800,260C1680,260,1560,260,1440,260C1320,260,1200,260,1080,260C960,260,840,260,720,260C600,260,480,260,360,260C240,260,120,260,60,260L0,260Z"></path></svg>
                    <svg viewBox="0 0 1440 260" class="MobileHidden SVGTop" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sw-gradient-0" x1="0" x2="0" y1="1" y2="0"><stop stop-color="rgba(0, 0, 0, 0)" offset="0%"></stop><stop stop-color="var(--accent-color)" offset="100%"></stop></linearGradient></defs><path style="transform:translate(0, 0px); opacity:1" fill="url(#sw-gradient-0)" d="M0,52L60,69.3C120,87,240,121,360,138.7C480,156,600,156,720,138.7C840,121,960,87,1080,73.7C1200,61,1320,69,1440,73.7C1560,78,1680,78,1800,73.7C1920,69,2040,61,2160,65C2280,69,2400,87,2520,99.7C2640,113,2760,121,2880,134.3C3000,147,3120,165,3240,173.3C3360,182,3480,182,3600,182C3720,182,3840,182,3960,190.7C4080,199,4200,217,4320,208C4440,199,4560,165,4680,130C4800,95,4920,61,5040,69.3C5160,78,5280,130,5400,160.3C5520,191,5640,199,5760,208C5880,217,6000,225,6120,199.3C6240,173,6360,113,6480,91C6600,69,6720,87,6840,112.7C6960,139,7080,173,7200,173.3C7320,173,7440,139,7560,112.7C7680,87,7800,69,7920,60.7C8040,52,8160,52,8280,78C8400,104,8520,156,8580,182L8640,208L8640,260L8580,260C8520,260,8400,260,8280,260C8160,260,8040,260,7920,260C7800,260,7680,260,7560,260C7440,260,7320,260,7200,260C7080,260,6960,260,6840,260C6720,260,6600,260,6480,260C6360,260,6240,260,6120,260C6000,260,5880,260,5760,260C5640,260,5520,260,5400,260C5280,260,5160,260,5040,260C4920,260,4800,260,4680,260C4560,260,4440,260,4320,260C4200,260,4080,260,3960,260C3840,260,3720,260,3600,260C3480,260,3360,260,3240,260C3120,260,3000,260,2880,260C2760,260,2640,260,2520,260C2400,260,2280,260,2160,260C2040,260,1920,260,1800,260C1680,260,1560,260,1440,260C1320,260,1200,260,1080,260C960,260,840,260,720,260C600,260,480,260,360,260C240,260,120,260,60,260L0,260Z"></path></svg>
                </div>
                <div class="Slide SlideContentHidden" id="SlideContent3">
                    <div class="GradientContainer">
                        <div class="Gr Gr-1"></div>
                        <div class="Gr Gr-2"></div>
                        <div class="Gr Gr-3"></div>
                    </div>
                    <div class="SlideInner" style="color: white">
                        <p class="Author">Connect</p>
                        <h1 class="Slide3">` + Localize(Locale, "pageTitle3") + `</h1>
                        <p class="Slide3" style="margin-top: 10px">My current Discord tag is <a href="https://discord.com/users/290350904094359562">Shaff#7921</a>, although I do not usually respond to direct messages on Discord.</p>
                    </div>
                </div>
                <div style="opacity: 1.0">
                    <div class="MobileButton MobileButtonNext Coloring1" onclick="GoDown()" style="opacity: 1">
                        <p>Next</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M24 40 8 24l2.1-2.1 12.4 12.4V8h3v26.3l12.4-12.4L40 24Z"/></svg>
                    </div>
                    <div class="MobileButton MobileButtonPrev Coloring2" onclick="GoUp()" style="opacity: 0">
                        <p>Previous</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M22.5 40V13.7L10.1 26.1 8 24 24 8l16 16-2.1 2.1-12.4-12.4V40Z"/></svg>
                    </div>
                </div>
            `;
            break;
        case AvailablePages.Dynamic:
            Article = JSON.parse(Article2.split("}")[0] + "}");
            var MarkdownString = Article2.replace(Article2.split("}")[0] + "}", "");

            // Markdown
            if (Custom != "") {
                MarkdownString += "\n\n" + Custom;
            }

            // Highlights codeblocks one at a time
            var NewMarkdown = "";
            var Lines = MarkdownString.split("\n");
            var CurrentCode = "";
            for (let i = 0; i < Lines.length; i++) {
                if (Lines[i].startsWith("    ") || Lines[i].includes("    ")) {
                    CurrentCode += Lines[i] + "\n";
                } else {
                    if (CurrentCode != "") {
                        NewMarkdown += Prism.highlight(CurrentCode, Prism.languages.cpp, "cpp");
                        CurrentCode = "";
                    } else {
                        NewMarkdown += Lines[i] + "\n";
                    }
                }
            }
            var MarkdownHtml = "";
            if (Article.disableHighlighting) {
                MarkdownHtml = Markdown.toHTML(MarkdownString);
            } else {
                MarkdownHtml = Markdown.toHTML(NewMarkdown);
            }
            // Markdown.toHTML escapes these characters, but we need them!
            var Length = MarkdownHtml.split("lt;").length + MarkdownHtml.split("gt;").length;
            for (let i = 0; i < Length; i++) {
                MarkdownHtml = MarkdownHtml.replace("&amp;lt;", "<")
                MarkdownHtml = MarkdownHtml.replace("&amp;gt;", ">")
                MarkdownHtml = MarkdownHtml.replace("&amp;quot;", "\"")
                MarkdownHtml = MarkdownHtml.replace("&lt;", "<")
                MarkdownHtml = MarkdownHtml.replace("&gt;", ">")
                MarkdownHtml = MarkdownHtml.replace("&quot", "\"")
                MarkdownHtml = MarkdownHtml.replace("&amp;", "&")
                MarkdownHtml = MarkdownHtml.replace("\";", "\"")
            }
            let ArticleTags = ""
            if (Article.tags) {
                ArticleTags += `<div class="ArticleTagContainer" style="margin-top: 20px;">`
                for (var y = 0; y < Article.tags.length; y++) {
                    ArticleTags += `<span class="ArticleTag">` + Article.tags[y] + `</span>`
                }
                ArticleTags += `</div>`
            }
            if (Article.video) {
                Output += `<video autoplay="" loop="" muted="" style="width: 100vw; height: 100vh; position: absolute; object-fit: cover; z-index: -1; filter: brightness(0.1);">
                    <source src="` + Article.video + `" type="video/mp4">
                </video>`
            }
            Output += `
            <div class="Slide SlideVisible ArticleImageBg" id="Slide1" style="background-color: black;` + (Article.background ? (` background: ` + Article.background) : ``) + `"></div>
            <div class="Slide SlideContentVisible SlideOccluded" id="SlideContent1">
                <div class="GradientContainer" style="filter: brightness(2)">
                    <div class="Gr Gr-1"></div>
                    <div class="Gr Gr-2"></div>
                    <div class="Gr Gr-3"></div>
                </div>
                <div class="SlideInner" style="color: white; margin-top: 0px; width: 100vw;">
                    <div class="Scrollable">
                        <br>
                        <br>
                        <br>
                        <div class="Icobox" style="border: none;">
                            <a class="Link" href="/" style="color: var(--accent-color);">
                                <svg class="Link" style="margin-bottom: -4px; margin-left: -1px; fill: var(--accent-color);" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 5 50 40"><path xmlns="http://www.w3.org/2000/svg" d="M24 40 8 24 24 8l2.1 2.1-12.4 12.4H40v3H13.7l12.4 12.4Z"/></svg>
                                Back
                            </a>
                        </div>` + (Article.showTitle ? (ArticleTags + `
                        <p class="ArticleTitleDate" style="margin-top: 50px">` + Article.date + `</p>
                        <h1 class="ArticleTitle" style="margin-top: 12px">` + Article.title + `</h1>
                        <h4 style="margin-top: 0px; font-weight: normal">` + Article.description + `</h4>
                        <p style="margin-top: 24px; padding-bottom: 50px; margin-bottom: 50px; border-bottom: 3px solid white;">Written by <strong>` + Article.author + `</strong></p>`) : ``) + `
                        ` + MarkdownHtml + ((Custom == "" && Filename != null) ? (Article.showTitle ? GenerateShareSection(Locale, Filename, Article) : ``) : ``) + `
                        <br>
                        <br>
                    </div>
                </div>
            </div>
        `;
            break;
        case AvailablePages.R:
            Output += await fs.readFile(__dirname.replace("generators", "assets") + "/Rem", { encoding: "utf-8" })
            break;
    }
    return Output + GenerateHeader(JSON.parse(Article2.split("}")[0] + "}")) + GenerateFooter(Localize(Locale, "copyright_main")) + `<div id="LoadingScreen" class="LoadingScreen LoadingScreenVisible" style="overflow: hidden"></div>`;
};
const GeneratePage = async function (
    Article,
    Locale,
    AvailablePages,
    AvailablePageSelector,
    Custom = "",
    Filename = "_None.md"
) {
    let HeadStr = await Head.GenerateHead(Article, Locale);
    let BodyStr = await GenerateBodyV2(
        Article,
        Locale,
        AvailablePages,
        AvailablePageSelector,
        Custom,
        Filename
    );

    let date = new Date();
    let diff = date - new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    let progress = (diff / (1000 * 60 * 60 * 24)) * 360;
    progress = 0

    Output =
        `
        <!DOCTYPE html>
        <html style="--accent-color-hue: ` + progress + `" lang="` +
        Localize(Locale, "locale_title") +
        `">
        <head>` +
        HeadStr +
        `</head>
        <body style="` + ((AvailablePageSelector == AvailablePages.R) ? `filter:invert(1); ` : ``) + `background-color: black;">
        <main>
        ` +
        BodyStr +
        `
        </main>
    ` +
        CreateTooltips() +
        `
        <script src="/Production.js"></script>
        </body>
        </html>
    `;
    return Output;
};

module.exports = { GeneratePageCached, GeneratePage, AvailablePages };
