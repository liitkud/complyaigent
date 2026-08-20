Name:           ferretops-cli
Version:        0.1.0
Release:        1%{?dist}
Summary:        FerretOPS Continuous Compliance Pre-Push Gate CLI (pg)

License:        MIT
URL:            https://github.com/liitkud/complyaigent
Source0:        https://github.com/liitkud/complyaigent/archive/refs/tags/v%{version}.tar.gz

BuildRequires:  golang >= 1.22
BuildRequires:  git

%description
FerretOPS CLI (pg) provides deterministic pre-push continuous compliance
validation, local regex rule evaluation, Presidio PII shielding, and
human-in-the-loop audit verification.

%prep
%autosetup -n complyaigent-%{version}

%build
cd cli
export GO111MODULE=on
export CGO_ENABLED=0
go build -v -ldflags "-s -w -X main.version=%{version}" -o pg ./main.go

%install
install -D -p -m 0755 cli/pg %{buildroot}%{_bindir}/pg

%check
cd cli
go test -v ./...

%files
%{_bindir}/pg

%changelog
* Fri Aug 21 2026 FerretOPS Release Team <maintainers@ferretops.dev> - 0.1.0-1
- Initial COPR package release for FerretOPS CLI
