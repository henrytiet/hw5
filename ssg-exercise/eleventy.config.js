// eleventy.config.js: settings for the HW5 static site generator exercise.
export default function (eleventyConfig) {
    // Copy these files to the output folder unchanged.
    eleventyConfig.addPassthroughCopy("src/index.css");
    eleventyConfig.addPassthroughCopy("src/fact-panel.css");
    eleventyConfig.addPassthroughCopy("src/theme.js");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/images");

    return {
        dir: {
            input: "src",          // page sources
            includes: "_includes", // layout and shared footer: src/_includes
            output: "_site"        // generated HTML goes here
        }
    };
}
