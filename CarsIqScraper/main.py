# library imports for web browser control, element location, an exceptions library which is used for try except blocks, and time pauses respectively
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from time import sleep
from selenium.common.exceptions import NoSuchElementException
import json
# this time import is just to see how long scraping took
import time

start_time = time.time()

# chrome setup options
options = webdriver.ChromeOptions()
options.add_argument('--start-maximized')
options.add_experimental_option('detach', True)

driver = webdriver.Chrome(options=options)
actions = ActionChains(driver)

# list to store all car dictionaries
all_cars = []

# open the website
driver.get('https://www.cars.iq/')
# the sleep here is to wait until the site loads
sleep(10)

# we want to change the language of the website so it doesn't affect our scraping
# this is a dropdown menu of multiple languages that has to be clicked to change language
language_list = driver.find_element(By.CLASS_NAME, 'dropdown')
language_list.click()
# select the first child to change the language to english
language_change = driver.find_element(By.XPATH, "//div[contains(@class,'dropdown-menu-right')]/*[1]")
language_change.click()

# website is slow to load
sleep(5)

show_all_cars_button = driver.find_element(By.XPATH, "//a[contains(text(),'Show Me')]")
show_all_cars_button.click()

# pagination
for page in range(1, 31):
    # the website takes a while to load the car pages, so we put another sleep to halt the automation until the elements are ready to be scraped
    sleep(5)
    car_cards = driver.find_elements(By.CSS_SELECTOR, "div.col-lg-6.col-md-12.col-xl-4")

    for element in car_cards:
        # fetch the link
        car_link = element.find_element(By.CSS_SELECTOR, 'a.text-dark').get_attribute('href')

        # fetch the thumbnail
        try:
            car_img = element.find_element(By.CSS_SELECTOR, 'img.cover-image').get_attribute('src')
        except NoSuchElementException:
            car_img = None

        # fetch the car name (without price)
        car_name = element.find_element(By.CSS_SELECTOR, 'a.text-dark h4').text.split('\n')[0].strip()

        # price
        try:
            price_text = element.find_element(By.CLASS_NAME, 'cars-price').text.strip()
            # text is 2 strings, so 2 array indices
            parts = price_text.split()
            price = parts[0]
            # sometimes listings have only price with no currency, so it should be taken regardless just without the currency
            currency = parts[1] if len(parts) > 1 else None
        except NoSuchElementException:
            price = None
            currency = None

        # trim/model
        try:
            car_trim = element.find_element(By.CSS_SELECTOR, 'div.item-card9-desc a:nth-child(2) span').text.strip()
        except NoSuchElementException:
            car_trim = None

        # year
        try:
            car_year = element.find_element(By.CSS_SELECTOR, 'a[title="year"]').text.strip()
        except NoSuchElementException:
            car_year = None

        # location
        try:
            car_location = element.find_element(By.CSS_SELECTOR, 'a[title="Car type"]').text.strip()
        except NoSuchElementException:
            car_location = None

        # mileage (Note: cars.iq uses KM only for the mileage unit)
        try:
            car_mileage = element.find_element(By.CSS_SELECTOR, 'a[title="distance"]').text.strip().replace('+', '').strip()
            mileage_unit = "KM"
        except NoSuchElementException:
            car_mileage = None
            mileage_unit = None

        # this dictionary was made with AI because i was too lazy to do this mundane task
        car_data = {
            "source": "Cars.iq",
            "car_link": car_link,
            "car_image": car_img,
            "car_name": car_name,
            "year": car_year,
            "mileage_value": car_mileage,
            "mileage_unit": mileage_unit,
            "trim": car_trim,
            "location": car_location,
            "price": price,
            "currency": currency
        }

        all_cars.append(car_data)
        print(car_data)

    # go to next page and stop if its 30 (to get 300 listings approx to match iq cars)
    if page < 31:
        try:
            # driver is used to search the whole page
            next_page = driver.find_element(By.CSS_SELECTOR, f'a.page-link[href*="page={page + 1}"]')
            driver.execute_script("arguments[0].click();", next_page)
            sleep(5)
        except NoSuchElementException:
            sleep(5)
            # sometimes the scraping script cannot find the next button for whatever reason, so we retry it
            try:
                next_page = driver.find_element(By.CSS_SELECTOR, f'a.page-link[href*="page={page + 1}"]')
                driver.execute_script("arguments[0].click();", next_page)
            except NoSuchElementException:
                print("No more pages")
                break

# save all scraped data to a json file
# indent=4 makes the file readable
with open("CarsIq.json", "w", encoding="utf-8") as f:
    json.dump(all_cars, f, indent=4)

print(f"Saved {len(all_cars)} cars to CarsIq.json")

# the following section was generated with AI
end_time = time.time()
elapsed = end_time - start_time
print(f"Script ran for {elapsed // 60:.0f} minutes and {elapsed % 60:.0f} seconds")