# Setup script for the gardefou Python package

from setuptools import setup, find_packages

setup(name="gardefou", packages=find_packages("src"), package_dir={"": "src"})
