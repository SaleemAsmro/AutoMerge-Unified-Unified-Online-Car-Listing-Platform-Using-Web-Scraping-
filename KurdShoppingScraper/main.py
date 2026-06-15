# library imports for web browser control, element location, an exceptions library which is used for try except blocks, and time pauses, respectively
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
driver.get('https://kurdshopping.com')

# The website is relatively fast to load, so a sleep of 5 seconds here is just in case there is traffic
sleep(5)

# We want to select english from the pop up language list
english_button = driver.find_element(By.XPATH,'//button[@aria-label="English"]')
english_button.click()

# Click on "Show Cars" button to view all listing pages
show_cars_button = driver.find_element(By.CLASS_NAME, "search-button")
show_cars_button.click()
# Sleep here so that everything can load before scraping starts
sleep(2)

# strip the part after ? for kurdshopping url so we can do pagination
base_url = driver.current_url.split('?')[0]

# pagination for loop till page 15 (to get approx 300 listings to match iq cars and cars.iq)
for page in range(1, 16):
    print(f"\n--- Page {page} ---")
    # pagination here is done through the URL because it's easier
    driver.get(f"{base_url}?page={page}")
    sleep(2)

    car_cards = driver.find_elements(By.CSS_SELECTOR, "article.border")

    for element in car_cards:
        # Fetch the link
        car_link = element.find_element(By.CLASS_NAME , "flex").get_attribute("href")

        # fetch the thumbnail
        try:
            car_img = element.find_element(By.CSS_SELECTOR, 'img.object-cover').get_attribute('src')
        except NoSuchElementException:
            car_img = None

        # fetch the car name
        car_name = element.find_element(By.CSS_SELECTOR, 'h2.text-\\[16px\\]').text.strip()

        # Fetch the trim, year, and location
        details = element.find_elements(By.CSS_SELECTOR, "p.fg-grey.text-xs.align-top")

        model = details[1].text.strip() if len(details) > 1 else "N/A"
        year = details[2].text.strip() if len(details) > 2 else "N/A"
        location = details[3].text.strip() if len(details) > 3 else "N/A"

        # price
        price_raw = element.find_element(By.CSS_SELECTOR, "h4.font-\\[500\\]").text.strip()
        # currency is always the first index
        currency = price_raw[0]
        # convert $ to USD because the other 2 websites had USD
        currency = "USD" if currency == "$" else currency
        # grabs everything from the second index till the end
        price = price_raw[1:].replace(",", "")  # the number

        # this dictionary was made with AI because i was too lazy to do this mundane task
        car_data = {
            "source": "KurdShopping",
            "car_link": car_link,
            "car_image": car_img,
            "car_name": car_name,
            "year": year,
            # the website does not have mileage, so to stay consistent with the other json files, the fields were added
            "mileage_value": "N/A",
            "mileage_unit": "N/A",
            "trim": model,
            "location": location,
            "price": price,
            "currency": currency
        }

        all_cars.append(car_data)
        print(car_data)

# save all scraped data to a json file
# indent=4 makes the file readable
with open("KurdShopping.json", "w", encoding="utf-8") as f:
    json.dump(all_cars, f, indent=4)

print(f"Saved {len(all_cars)} cars to KurdShopping.json")

# the following section was generated with AI
end_time = time.time()
elapsed = end_time - start_time
print(f"Script ran for {elapsed // 60:.0f} minutes and {elapsed % 60:.0f} seconds")