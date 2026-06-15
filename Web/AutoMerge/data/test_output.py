import json
import os

# configuration
JSON_FILES = {
    "CarsIq.json":       "Cars.iq",
    "IQcars.json":       "IQ Cars",
    "KurdShopping.json": "KurdShopping"
}

REQUIRED_FIELDS = [
    "source", "car_link", "car_image", "car_name",
    "year", "mileage_value", "mileage_unit",
    "trim", "location", "price", "currency"
]

VALID_CURRENCIES = {"USD", "IQD", None}

# test functions

def test_file_exists(filepath):
    # check that the JSON file exists on disk
    assert os.path.exists(filepath), f"File not found: {filepath}"

def test_file_not_empty(data, filepath):
    # check that the JSON file contains at least 1 record
    assert len(data) > 0, f"File is empty: {filepath}"

def test_required_fields(record, index):
    # check that every required field is present in the record
    for field in REQUIRED_FIELDS:
        assert field in record, \
            f"Record {index}: missing field '{field}'"

def test_source_value(record, index, expected_source):
    # check that the source field matches the expected platform name
    assert record["source"] == expected_source, \
        f"Record {index}: expected source '{expected_source}', got '{record['source']}'"

def test_price_is_numeric(record, index):
    # check that the price field, if present, contains only digits
    price = record.get("price")
    if price is not None:
        assert price.replace(".", "").replace(",", "").isdigit(), \
            f"Record {index}: non-numeric price value '{price}'"

def test_currency_is_valid(record, index):
    # check that the currency field is USD, IQD, or None
    currency = record.get("currency")
    assert currency in VALID_CURRENCIES, \
        f"Record {index}: unexpected currency value '{currency}'"

def test_year_is_four_digits(record, index):
    # check that the year field, if present, is a four-digit string
    year = record.get("year")
    if year and year != "N/A":
        assert len(str(year)) == 4 and str(year).isdigit(), \
            f"Record {index}: unexpected year value '{year}'"

def test_kurdshopping_mileage_is_na(record, index):
    # check that KurdShopping records store mileage as N/A
    assert record.get("mileage_value") == "N/A", \
        f"Record {index}: expected mileage_value 'N/A', got '{record.get('mileage_value')}'"
    assert record.get("mileage_unit") == "N/A", \
        f"Record {index}: expected mileage_unit 'N/A', got '{record.get('mileage_unit')}'"

def test_no_symbol_in_price(record, index):
    # check that price field contains no currency symbols or commas
    price = record.get("price")
    if price:
        for symbol in ["$", ",", "IQD", "USD"]:
            assert symbol not in price, \
                f"Record {index}: price '{price}' contains symbol '{symbol}'"

# test runner

def run_tests_for_file(filepath, expected_source):
    print(f"\n{'='*60}")
    print(f"  Testing: {filepath}  (expected source: {expected_source})")
    print(f"{'='*60}")

    passed = 0
    failed = 0
    failures = []

    # file level tests
    file_tests = [
        ("File exists on disk",         lambda: test_file_exists(filepath)),
    ]

    # load file
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  [FAIL] Could not load file: {e}")
        return 0, 1

    file_tests.append(
        ("File contains at least one record", lambda: test_file_not_empty(data, filepath))
    )

    for name, test_fn in file_tests:
        try:
            test_fn()
            print(f"  [PASS] {name}")
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {name} — {e}")
            failed += 1
            failures.append(str(e))

    print(f"\n  Record count: {len(data)}")
    print(f"  Running per-record tests...\n")

    # per record tests
    record_test_names = [
        "All required fields present",
        "Source field matches expected platform",
        "Price is numeric",
        "Currency is valid (USD / IQD / None)",
        "Year is four digits",
        "No currency symbols in price field",
    ]

    record_pass = {name: 0 for name in record_test_names}
    record_fail = {name: [] for name in record_test_names}

    for i, record in enumerate(data):
        tests = [
            (record_test_names[0], lambda r=record, idx=i: test_required_fields(r, idx)),
            (record_test_names[1], lambda r=record, idx=i: test_source_value(r, idx, expected_source)),
            (record_test_names[2], lambda r=record, idx=i: test_price_is_numeric(r, idx)),
            (record_test_names[3], lambda r=record, idx=i: test_currency_is_valid(r, idx)),
            (record_test_names[4], lambda r=record, idx=i: test_year_is_four_digits(r, idx)),
            (record_test_names[5], lambda r=record, idx=i: test_no_symbol_in_price(r, idx)),
        ]

        if expected_source == "KurdShopping":
            tests.append(
                ("KurdShopping mileage stored as N/A",
                 lambda r=record, idx=i: test_kurdshopping_mileage_is_na(r, idx))
            )

        for name, test_fn in tests:
            try:
                test_fn()
                record_pass[name] = record_pass.get(name, 0) + 1
            except AssertionError as e:
                record_fail[name].append(str(e))

    # print per record summary
    all_names = record_test_names[:]
    if expected_source == "KurdShopping":
        all_names.append("KurdShopping mileage stored as N/A")

    for name in all_names:
        fail_count = len(record_fail.get(name, []))
        pass_count = len(data) - fail_count
        if fail_count == 0:
            print(f"  [PASS] {name} ({pass_count}/{len(data)} records)")
            passed += 1
        else:
            print(f"  [FAIL] {name} — {fail_count} record(s) failed")
            for msg in record_fail[name][:3]:  # show first 3 failures only
                print(f"         {msg}")
            failed += 1

    return passed, failed


def main():

    total_passed = 0
    total_failed = 0

    for filename, source in JSON_FILES.items():
        p, f = run_tests_for_file(filename, source)
        total_passed += p
        total_failed += f

    print(f"\n{'='*60}")
    print(f"  RESULTS: {total_passed} passed, {total_failed} failed")
    if total_failed == 0:
        print("  All tests passed successfully.")
    else:
        print("  Some tests failed. See details above.")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
