#!/usr/bin/env python3
"""Temporary script to fix homepage service cards."""
import re

filepath = r'D:\zt lounge\zt-lounge-demo\zt-lounge\index.html'
with open(filepath, encoding='utf-8') as f:
    content = f.read()

# Find the service-cards-grid div and replace its contents
start_marker = '<div class="service-cards-grid">'
end_marker = '</div>\n            </div>\n        </section>'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find start marker")
    exit(1)

# Find the closing </section> after the grid
section_end = content.find('</section>', start_idx)
if section_end == -1:
    print("ERROR: Could not find section end")
    exit(1)

# Replace everything from the grid start to the section end
old_section = content[start_idx:section_end + len('</section>')]

new_section = '''<div class="service-cards-grid">
                    <!-- DB-driven: populated by content-loader.js populateServiceCards() -->
                    <!-- Cards are rendered from ServicesRepository.getAll() (services table) -->
                </div>
            </div>
        </section>'''

content = content[:start_idx] + new_section + content[section_end + len('</section>'):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Homepage service cards replaced with DB-driven placeholder")
