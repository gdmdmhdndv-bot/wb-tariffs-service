import log4js from "log4js";

log4js.configure({
    appenders: {
        console: {
            type: "console",
            layout: {
                type: "pattern",
                pattern: "%d{yyyy-MM-dd hh:mm:ss} [%p] %c - %m",
            },
        },
    },
    categories: {
        default: { appenders: ["console"], level: "info" },
    },
});

export function getLogger(category: string) {
    return log4js.getLogger(category);
}
