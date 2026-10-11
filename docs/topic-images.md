# Topic photographs

These photographs are stored locally and served by Storyfields. Monochrome styling applies to the homepage topic tiles through the existing `ResponsiveImage` component and CSS.

| Topic | Asset | Creator / provenance | Source |
| --- | --- | --- | --- |
| People / Άνθρωποι | `public/uploads/topics/people-editorial.jpg` | ChatGPT-generated editorial photograph, approved by Debbie Moraiti on 11 October 2026 | `storyfields-approved-topic-images.zip` → `people-editorial.jpg`; original image: `sunlit_shadows_on_a_city_sidewalk.png` |
| Ideas | `public/uploads/topics/ideas-typewriter.jpg` | Colin + Meg | https://unsplash.com/photos/an-old-fashioned-typewriter-sitting-on-a-wooden-table-BZSzuukIy9c |
| Culture | `public/uploads/topics/culture-books.jpg` | Wesley Tingey | https://unsplash.com/photos/full-bookshelf-ghHUi-j_eko |
| Music / Μουσική | `public/uploads/topics/music-editorial.jpg` | ChatGPT-generated editorial photograph, approved by Debbie Moraiti on 11 October 2026 | `storyfields-approved-topic-images.zip` → `music-editorial.jpg`; original image: `monochrome_guitar_studio_still_life.png` |
| Digital | `public/uploads/topics/digital-workspace.jpg` | JESHOOTS.COM | https://unsplash.com/photos/an-open-empty-notebook-on-a-white-desk-next-to-an-iphone-and-a-macbook-pUAM5hPaCRI |
| Everyday Life / Καθημερινότητα | `public/uploads/topics/everyday-life-editorial.jpg` | ChatGPT-generated editorial photograph, approved by Debbie Moraiti on 11 October 2026 | `storyfields-approved-topic-images.zip` → `everyday-life-editorial.jpg`; original image: `cozy_monochrome_reading_nook.png` |

The Ideas, Culture and Digital photographs are available under the [Unsplash License](https://unsplash.com/license).

## Approved photographs

The three approved assets were recovered from the existing Storyfields conversation and its `storyfields-approved-topic-images.zip` bundle. The repository JPG files are copied byte for byte from that bundle, with their original dimensions of 1200 × 800 pixels:

- **People:** pedestrians walking along an urban street with strong shadows.
- **Music:** a black electric guitar in front of an amplifier, with drums in the background.
- **Everyday Life:** a table beside a window, with books, a plant and a coffee mug.

All three retain `imageFocusX: 50`. The existing image pipeline creates responsive AVIF/WebP variants and sanitizes metadata in deployed uploads. The topic-card dimensions, typography, borders, spacing and responsive layout use the existing implementation. Article-image assets are unchanged.
