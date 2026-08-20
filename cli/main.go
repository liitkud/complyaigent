package main

import (
	"fmt"
	"os"

	"github.com/liitkud/ferretops-cli/cmd"
)

func main() {
	if err := cmd.Execute(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
