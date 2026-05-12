import os

file_path = 'src/pages/Reports.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Pie Chart tooltip block
old_pie_tooltip = """                          <RechartsTooltip 
                             contentStyle={{ 
                               backgroundColor: 'hsl(var(--popover))', 
                               borderRadius: '12px', 
                               border: '1px solid hsl(var(--border))', 
                               color: 'hsl(var(--popover-foreground))', 
                               padding: '10px', 
                               boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                             }}
                             itemStyle={{ fontWeight: 'bold' }}
                           />"""

# More generic match
import re
pattern = r'<RechartsTooltip\s+contentStyle={{[^}]+}}\s+itemStyle={{ fontWeight: \'bold\' }}\s+/>'
replacement = """<RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              borderRadius: '12px', 
                              border: '1px solid hsl(var(--border))', 
                              color: 'hsl(var(--popover-foreground))', 
                              padding: '12px', 
                              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                              backdropFilter: 'blur(8px)'
                            }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                          />"""

new_content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
