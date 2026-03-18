import sys
import os

with open("template.cpp", "r") as f:
	template = "".join(f.readlines())

for filename in os.listdir("."):
	if filename.endswith(".mdx"):
		mod = False
		with open(filename, "r") as f:
			lines = f.readlines()
			if "Qi" not in lines[4]:
				continue
			# print("HA",filename)
			for i in range(len(lines) - 1):
				if lines[i] == "```cpp\n" and not lines[i + 1].startswith("#include"):
					# print("BAD",filename)
					lines[i] += template
					mod = True
		if mod:
			with open(filename, "w") as f:
				f.write("".join(lines))
			# sys.exit(0)
