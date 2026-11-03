# Sensemodo

A multilingual website for an independent AI consulting practice, turning business needs into clear service offers and project briefs.

**[Explore the English version](https://sensemodo.com/?lang=en)**

## Product overview

Service positioning and offer selection; browser-based project brief; localized content; referral information; SEO pages and analytics infrastructure.

## About this project

A product project by **Ilya Ermolayev**, developed with AI-assisted implementation. This repository presents the product and its implementation for portfolio review. It is a snapshot of an actively evolving product, not a claim that every production integration can run without configuration.

## Technology

HTML/CSS, JavaScript, React/TypeScript hosting layer, Vinext/Vite, Cloudflare Workers and Drizzle.

## Run locally

Use Node.js 22.13 or newer. PlayTrickle's content checks also require Python 3.

```sh
node dev-server.cjs
```

Open http://localhost:3000/?lang=en. This starts the static interface. For the framework host and server routes, use `npm ci` then `npm run dev`; production analytics and database bindings require separate configuration.

## Repository guide

- `out/` — authored website content, styles and interactions
- `scripts/` — SEO and build tooling
- `app/`, `worker/` — hosting and API integration
- `components/` — shared React components
- `tests/` — automated checks

## Deployment and data

The live product uses separately configured hosting and services. Supply your own credentials and database bindings when deploying a copy. Never commit secrets or personal user data. Historical APK releases and generated build caches are not needed for source review.

English is the language of this repository's documentation; the product retains its supported interface languages.

## Ownership

No open-source license is granted by this repository. Third-party components and assets retain their respective licenses.
