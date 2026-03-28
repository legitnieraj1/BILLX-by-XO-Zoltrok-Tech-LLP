# Design System Specification: billX by Zoltrok Tech LLP

## 1. Overview & Creative North Star: "The Digital Concierge"

The design system for **billX** is anchored in a Creative North Star we call **"The Digital Concierge."** In the high-stakes environment of a Point-of-Sale (POS) system, premium quality is not defined by flashy ornaments, but by invisible precision, effortless flow, and an authoritative editorial layout.

To break the "standard SaaS template" look, we move away from rigid, boxy grids. Instead, we utilize **intentional asymmetry** and **tonal layering**. Elements are not merely placed; they are curated on the screen. We prioritize breathing room over information density, ensuring that even the most complex billing data feels calm, curated, and high-end—reminiscent of a luxury editorial spread or a flagship boutique interface.

---

## 2. Color & Surface Philosophy

The palette is rooted in the "Deep Blue" of professional trust and the "Accent Orange" of tactile energy. However, the secret to the billX premium feel lies in how we manage transitions.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. They create visual noise and "trap" the eye. Instead, boundaries must be defined through:
*   **Background Shifts:** Transitioning from `surface` (#f7f9fb) to `surface_container_low` (#f2f4f6).
*   **Tonal Transitions:** Using subtle shifts in the surface-container tiers to imply a new zone.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper. 
*   **The Base:** Use `surface` as your canvas.
*   **The Content Zone:** Use `surface_container_low` for large content areas (like a product grid).
*   **The Action Layer:** Use `surface_container_lowest` (#ffffff) for the highest-priority interactive elements (like the active billing card).

### The "Glass & Signature Texture" Rule
To elevate the POS beyond a flat utility, use **Glassmorphism** for floating overlays (e.g., a checkout summary bar). Apply `surface_container_lowest` with a 70% opacity and a `backdrop-blur` of 20px. 
*   **Signature Gradient:** For primary CTAs, do not use a flat hex. Apply a subtle linear gradient from `primary` (#022448) to `primary_container` (#1E3A5F) at a 135-degree angle. This adds "soul" and a tactile, embossed quality.

---

## 3. Typography: Editorial Authority

We use **Inter** as our typographic backbone. The goal is to create a clear hierarchy that guides the merchant's eye through a sea of data without fatigue.

*   **Display & Headlines:** Use `display-md` for big-picture metrics (e.g., Total Revenue). Use `headline-sm` for section titles. These should feel authoritative and spaced generously.
*   **Titles & Body:** `title-md` is reserved for item names in the cart. `body-md` handles the bulk of transactional data.
*   **Labels:** Use `label-md` in all-caps with a 0.05em letter spacing for metadata (e.g., SKU numbers or Time Stamps) to provide a professional, "receipt-like" precision.

*Director's Note:* Always prioritize optical alignment over mathematical alignment. Type should feel like it's floating in the center of its container’s "breathable" space.

---

## 4. Elevation & Depth: Tonal Layering

We reject the "drop shadow" of the early 2010s. In this design system, depth is a whisper, not a shout.

*   **The Layering Principle:** Avoid shadows for static layout components. If a card needs to stand out, place a `surface_container_lowest` card on a `surface_container_low` background. This creates a "Soft Lift."
*   **Ambient Shadows:** For floating elements (Modals, Dropdowns), use a shadow tinted with `on_surface` at 4% opacity with a blur radius of 32px. It should look like ambient light hitting a physical object.
*   **The Ghost Border:** If accessibility requires a stroke (e.g., in high-glare environments), use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components & Interaction Patterns

### Buttons: The Tactile Touchpoint
*   **Primary:** Gradient (`primary` to `primary_container`), `xl` (1.5rem) rounded corners. Text is `on_primary`.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Transparent background, `primary` text. Use for low-emphasis actions like "Add Note."

### Input Fields: Soft Focus
*   **State:** Default inputs use `surface_container_high` backgrounds. 
*   **Focus State:** The background shifts to `surface_container_lowest` and gains a 2px "Ghost Border" of `primary` at 20% opacity.
*   **Corner Radius:** Always `md` (0.75rem) to maintain the modern SaaS feel.

### Cards & Lists: The No-Divider Rule
*   **Lists:** Forbid the use of horizontal divider lines. Use `spacing-4` (1.4rem) between list items. The white space is your divider.
*   **Product Cards:** Use `surface_container_low` with a subtle hover transition to `surface_container_highest`. 

### Specialized POS Components
*   **The "Living Receipt":** A vertical container using `surface_container_lowest` with a soft `xl` corner radius. Use `label-sm` for item modifiers to maintain an organized, premium look.
*   **Quick-Action Chips:** Rounded `full` (pill-shaped). Use `secondary_container` (#fd761a) with `on_secondary_container` text for "Sale" or "Discount" tags to catch the eye without breaking the blue professional aesthetic.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use the `spacing-6` (2rem) and `spacing-8` (2.75rem) tokens liberally. If it feels too spaced out, it’s probably just right.
*   **Do** use "Surface Nesting" to group related items (e.g., a customer’s details inside a slightly darker container than the main bill).
*   **Do** ensure all interactive touch targets are at least 44px in height for the POS environment.

### Don't:
*   **Don't** use pure black (#000000) for text. Use `on_surface` (#191c1e) to keep the interface feeling soft and premium.
*   **Don't** use 1px solid borders to separate the sidebar from the main content. Use a background color shift.
*   **Don't** use the Accent Orange for everything. It is a "surgical" color—use it only for the most important action on the screen (e.g., "Complete Payment").

---

**Final Note to Designers:** 
The billX interface should feel like a high-end tool for a modern artisan. It is not just a billing software; it is the digital face of Zoltrok Tech LLP. Every pixel should reflect intentionality, luxury, and calm.