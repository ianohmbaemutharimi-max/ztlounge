#!/usr/bin/env python3
"""Fix indentation in vip.html"""
filepath = r'D:\zt lounge\zt-lounge-demo\zt-lounge\pages\experiences\vip.html'
with open(filepath, encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 939 (index 938)
lines[938] = '                            <select id="cabinPackage" name="cabinPackage" class="form-select" required aria-required="true" data-charge-options>\n'

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed vip.html indentation')
