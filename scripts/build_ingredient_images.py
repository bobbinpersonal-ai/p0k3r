import json

m = json.load(open('scripts/ingredient_images.json'))
names = sorted(m)
assert not any('"' in n or '|' in n for n in names), "name would break the literal"
assert not any('"' in m[n] or '|' in m[n] for n in names), "filename would break the literal"

names_lit = "|".join(names)
files_lit = "|".join(m[n] for n in names)

header = '''{%- comment -%}
  Real ingredient photography, keyed by the ingredient name used in each pack's
  spadra.components metafield.

  These are the supplier's actual photographs of the capsules that ship in the
  pouch -- not illustrations, not CSS renders. They already live in the shop's
  Files (uploaded with the ingredient name as their alt text, which is how this
  map was built); nothing here was generated for the storefront.

  Why absolute CDN URLs rather than the file_url filter: every one of the 60
  URLs below was fetched and confirmed to return HTTP 200 before being written
  here. file_url could not be verified from outside a rendered page, and a
  filename that is even slightly wrong fails silently as a broken image -- the
  exact failure this map exists to avoid. Do not hand-edit a filename; re-run
  the Files query and regenerate.

  Names are matched case-insensitively. An ingredient with no confirmed photo
  renders nothing (name mode) or falls back to a text pill (components mode),
  never a guessed path. Glucosamine is currently the only ingredient in use
  with no photo on file.

  Class names are deliberately prefixed spadra-ingshot-. Do NOT use
  spadra-ing / spadra-ing-list / spadra-ing__name here: sections/spadra-pdp
  already owns those for its "What's Inside" benefit cards, and snippet and
  section CSS are concatenated into the same global bundle, so reusing them
  would silently restyle that grid.

  Usage:
    {% render 'spadra-ingredient-images', name: c %}
      -> just the round capsule shot for one ingredient, or nothing

    {% render 'spadra-ingredient-images', components: components %}
      -> a row of photo chips, with a text pill wherever no photo exists

    {% render 'spadra-ingredient-images', as_json: true %}
      -> emits the map as JSON for client-side use (the quiz result cards)
{%- endcomment -%}

{%- liquid
  assign spadra_ing_base = 'https://cdn.shopify.com/s/files/1/0758/4189/6587/files/'
  assign spadra_ing_names = "NAMES_LITERAL" | split: '|'
  assign spadra_ing_files = 'FILES_LITERAL' | split: '|'
-%}
'''

header = header.replace('NAMES_LITERAL', names_lit).replace('FILES_LITERAL', files_lit)

body = r'''
{%- if as_json -%}
  <script type="application/json" data-spadra-ingredient-images>
    {
      {%- for n in spadra_ing_names -%}
        {%- unless forloop.first %},{% endunless -%}
        {{ n | downcase | json }}: {{ spadra_ing_base | append: spadra_ing_files[forloop.index0] | json }}
      {%- endfor -%}
    }
  </script>

{%- elsif name != blank -%}
  {%- liquid
    assign want = name | downcase | strip
    assign found_file = ''
    for n in spadra_ing_names
      assign have = n | downcase | strip
      if have == want
        assign found_file = spadra_ing_files[forloop.index0]
        break
      endif
    endfor
  -%}
  {%- if found_file != blank -%}
    <span class="spadra-ingshot">
      <img src="{{ spadra_ing_base | append: found_file }}?width=160"
           alt="{{ name }} capsule"
           width="160" height="160" loading="lazy" decoding="async">
    </span>
  {%- endif -%}

{%- else -%}
  {%- if components and components.size > 0 -%}
    <ul class="spadra-ingshot-list">
      {%- for component in components -%}
        {%- liquid
          assign want = component | downcase | strip
          assign found_file = ''
          for n in spadra_ing_names
            assign have = n | downcase | strip
            if have == want
              assign found_file = spadra_ing_files[forloop.index0]
              break
            endif
          endfor
        -%}
        {%- if found_file != blank -%}
          <li class="spadra-ingshot-chip">
            <span class="spadra-ingshot">
              <img src="{{ spadra_ing_base | append: found_file }}?width=160"
                   alt="{{ component }} capsule"
                   width="160" height="160" loading="lazy" decoding="async">
            </span>
            <span class="spadra-ingshot-chip__name">{{ component }}</span>
          </li>
        {%- else -%}
          <li class="spadra-pill">{{ component }}</li>
        {%- endif -%}
      {%- endfor -%}
    </ul>
  {%- endif -%}
{%- endif -%}

{% stylesheet %}
  .spadra-ingshot {
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    overflow: hidden;
    background: #F8F7F4;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .spadra-ingshot img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .spadra-ingshot-list {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
    padding: 0;
  }
  .spadra-ingshot-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 100px;
    padding: 4px 11px 4px 4px;
    box-shadow: 0 1px 3px rgba(16, 23, 34, 0.06);
    min-width: 0;
  }
  .spadra-ingshot-chip__name {
    font-size: 0.72rem;
    line-height: 1.2;
    color: #33383F;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
{% endstylesheet %}
'''

open('theme-src/snippets/spadra-ingredient-images.liquid', 'w').write(header + body)
print("wrote snippet, %d ingredients" % len(names))
