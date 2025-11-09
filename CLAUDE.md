

# Project: High-taste website + description + tags repository

## Overview

A potential client of TasteAI wishes to curate a collection of high-taste websites that it could use as inspirations when users ask for website/web application generations. The potential client’s application will search for website inspiration in this repository based on the user’s prompt, pass the screenshot of appropriate inspiration to the model, and ask the model to generate a website/web application in similar style as the inspiration. Our job is to curate this repository of high-taste websites that the client’s application can easily search through as a step in their code generation pipeline.

## Deliverable

A pipeline that allows us to pass any webpage, and generate the following for each webpage:

1. A full screenshot of the webpage
2. A granular description of the webpage
3. Meta-annotations regarding style, occasion, intent, user type, etc.

The websites can be landing pages, information dense pages (e.g. directories, news/publisher sites, or web applications with logins)

The pipeline would be used to process thousands of webpages for the potential client.

The pipeline should also be extendible to accommodate human annotation as well. As in the future, we might want human annotators to submit websites, or annotate websites that we have curated

Pieces of metadata to extract: 
Style (e.g. modern, brutalist etc)
Font types
Audience (e.g. gen z women) 
Page Type (e.g. homepage, team page, event page, ecommerce page etc.)	
Layout style (standard vs. trendy vs. creative/unique)
Description of intent (e.g. homepage of a VC page)  