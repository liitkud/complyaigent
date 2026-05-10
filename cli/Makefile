APP_EXECUTABLE=pg

build:
	GOARCH=amd64 go build -o ${APP_EXECUTABLE} main.go

run: build
	./${APP_EXECUTABLE}

clean:
	go clean
	rm ${APP_EXECUTABLE}

check-quality:
	make fmt
	make vet
	make tidy
	`
vet:
	go vet ./...

fmt:
	go fmt ....

tidy:
	go mod tidy

install: build
	cp ${APP_EXECUTABLE} ~/.local/bin/pg
	chmod +x ~/.local/bin/pg

install-global: build
	sudo cp ${APP_EXECUTABLE} /usr/local/bin/pg
	sudo chmod +x /usr/local/bin/pg

uninstall:
	rm ~/.local/bin/pg

uninstall-global:
	sudo rm /usr/local/bin/pg
