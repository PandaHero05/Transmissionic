import {Locale} from "./Locale";
import * as Plurals from 'make-plural/plurals';

import en from "../../public/locales/en.json";

const languages: Record<string,any> = {en};

const list: Array<string> = [
    "cs",
    "de",
    "de-at",
    "el",
    "en",
    "es-419",
    "es-cl",
    "es-cr",
    "es-pe",
    "fr",
    "fr-ch",
    "hu",
    "it",
    "ko",
    "nl",
    "pl",
    "pt",
    "pt-br",
    "ru",
    "sk",
    "uk",
    "zh-cn",
    "zh-tw",
];

const aliases: Record<string,any> = {
    es:'es-419',
    zh:'zh-cn',
};

// Regional variants that only contain overrides on top of a base locale.
// Keys missing in the variant are taken from its parent (then from English).
const parents: Record<string,string> = {
    'es-pe':'es-419',
};

function deepMerge(base: Record<string,any>, override: Record<string,any>): Record<string,any> {
    const result: Record<string,any> = {...base};
    for (const [key, value] of Object.entries(override)) {
        result[key] = (value && typeof value === 'object' && base[key] && typeof base[key] === 'object')
            ? deepMerge(base[key], value)
            : value;
    }
    return result;
}

export const LocaleController = {
    async setLanguage(language: string): Promise<void> {
        const code = this.getLanguageCode(language);
        if(!languages[code]) {
            await this.loadLanguages(code)
                .then((data) => {
                    languages[code]=data;
                    Locale.setContent(languages);
                })
                .catch(()=> {return})
        }
        Locale.setLanguage(code);
    },
    loadLanguages(code: string): Promise<Record<string,any>> {
        const own = fetch(`locales/${code}.json`)
            .then((response) => response.json());
        const parent = parents[code];
        if(!parent) {
            return own;
        }
        return Promise.all([this.loadLanguages(parent), own])
            .then(([base, data]) => deepMerge(base, data));
    },
    getLanguageCode(language: string, short=false): string {
        const code = language.toLowerCase();
        if(list.includes(code)){
            return code;
        }
        else if(aliases[code]){
            return aliases[code];
        }
        else if(!short) {
            return this.getLanguageCode(code.substring(0,2), true)
        }
        else {
            return "en";
        }
    },
    getPlural(key: string, count: number): string {
        let lang = Locale.getLanguage();
        if(!Object(Plurals)[lang]){
            lang = lang.substring(0,2);
        }
        const form = Object(Plurals)[lang] ? Object(Plurals)[lang](count) : "other";
        return this.getForm(key, form);
    },
    getForm(key: string, form: string): string {
        return (Object(Locale)[key][form]) ? Object(Locale)[key][form] : Object(Locale)[key]["one"];
    }
}