srpm:
	mkdir -p /tmp/rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}
	git archive --format=tar.gz --prefix=ferretops-cli-0.1.0/ HEAD -o /tmp/rpmbuild/SOURCES/v0.1.0.tar.gz
	cp cli/packaging/rpm/ferretops-cli.spec /tmp/rpmbuild/SPECS/
	rpmbuild -bs --define "_topdir /tmp/rpmbuild" /tmp/rpmbuild/SPECS/ferretops-cli.spec
	cp /tmp/rpmbuild/SRPMS/*.src.rpm $(outdir)/
