.PHONY: .all clean

all: dist/focus.zip

clean:
	rm dist/focus.zip

dist/focus.zip:
	zip -r -FS dist/focus.zip * --exclude *.git* --exclude dist
