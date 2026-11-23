document.addEventListener("DOMContentLoaded", async function () {
  const API_URL =
    "https://raw.githubusercontent.com/HedaetShahriar/bangladesh-locations-dataset/main/data/bd_locations.json";

  const country = document.getElementById("country");
  const division = document.getElementById("division");
  const district = document.getElementById("district");
  const thana = document.getElementById("thana");
  const area = document.getElementById("area");
  const postal = document.getElementById("postal_code");

  if (!country || !division || !district || !thana || !area || !postal) {
    return;
  }

  let locationData = null;

  function resetSelect(select, placeholder) {
    select.replaceChildren(new Option(placeholder, ""));
    select.disabled = true;
  }

  function clearAfter(level) {
    if (level <= 1) resetSelect(district, "select district");
    if (level <= 2) resetSelect(thana, "select thana or upazila");
    if (level <= 3) resetSelect(area, "select area");

    if (level <= 4) postal.value = "";
  }

  function fillSelect(select, items, placeholder) {
    resetSelect(select, placeholder);

    (items || []).forEach(function (item) {
      const option = new Option(item.bnName || item.name, String(item.id));

      if (item.name && item.bnName && item.name !== item.bnName) {
        option.textContent = item.bnName + " (" + item.name + ")";
      }

      select.add(option);
    });

    select.disabled = false;
  }

  function findById(items, id) {
    return (items || []).find(function (item) {
      return String(item.id) === String(id);
    });
  }

  try {
    country.disabled = true;
    resetSelect(division, "loading...");

    const response = await fetch(API_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("API response not OK: " + response.status);
    }

    locationData = await response.json();

    country.disabled = false;
    country.value = "BD";

    fillSelect(division, locationData.divisions, "select division");
  } catch (error) {
    country.disabled = false;
    resetSelect(division, "division failed to load");
    console.error("Location API error:", error);
    toast.error("Failed to load location data. Please try again later.");
    return;
  }

  country.addEventListener("change", function () {
    clearAfter(1);
    resetSelect(division, "select division");

    if (country.value !== "BD" || !locationData) return;

    fillSelect(division, locationData.divisions, "select division");
  });

  division.addEventListener("change", function () {
    clearAfter(1);

    const selectedDivision = findById(locationData.divisions, division.value);

    if (!selectedDivision) return;

    fillSelect(district, selectedDivision.districts, "select district");
  });

  district.addEventListener("change", function () {
    clearAfter(2);

    const selectedDivision = findById(locationData.divisions, division.value);

    const selectedDistrict = findById(
      selectedDivision?.districts,
      district.value,
    );

    if (!selectedDistrict) return;

    fillSelect(thana, selectedDistrict.upazilas, "select thana or upazila");
  });

  thana.addEventListener("change", function () {
    clearAfter(3);

    const selectedDivision = findById(locationData.divisions, division.value);

    const selectedDistrict = findById(
      selectedDivision?.districts,
      district.value,
    );

    const selectedThana = findById(selectedDistrict?.upazilas, thana.value);

    if (!selectedThana) return;

    fillSelect(area, selectedThana.areas, "select area");
  });

  area.addEventListener("change", function () {
    postal.value = "";

    const selectedDivision = findById(locationData.divisions, division.value);

    const selectedDistrict = findById(
      selectedDivision?.districts,
      district.value,
    );

    const selectedThana = findById(selectedDistrict?.upazilas, thana.value);

    const selectedArea = findById(selectedThana?.areas, area.value);

    if (!selectedArea) return;

    postal.value = selectedArea.postalCode || "";
  });
});
