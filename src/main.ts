import "./style.css";
import { unzip } from "unzipit";
import { initRunners } from "./runners";

type Result = {
  error?: string;
  totalWalkedDistanceKm?: number;
};

function handleFileProcessed(result: Result) {
  document.querySelector("#fileProcessing")!.classList.add("hidden");

  const fileInputEl = document.querySelector('input[type="file"]')!;
  const fileErrorEl = document.querySelector("#fileError")!;
  const instructionsEl = document.querySelector("#instructions")!;
  const resultsEl = document.querySelector("#results")!;

  if (result.error) {
    fileErrorEl.textContent = `${result.error} Please try again.`;
    fileErrorEl.classList.remove("hidden");
    fileInputEl.classList.remove("hidden");
  } else {
    instructionsEl.classList.add("hidden");
    resultsEl.classList.remove("hidden");

    const totalWalkedDistanceKm = result.totalWalkedDistanceKm!;
    const totalWalkedDistanceMiles = totalWalkedDistanceKm / 1.60934;
    const totalMarathonsWalked = totalWalkedDistanceKm / 42.195;

    document.querySelector("#results #distanceKm")!.textContent =
      totalWalkedDistanceKm.toFixed(2);
    document.querySelector("#results #distanceMiles")!.textContent =
      totalWalkedDistanceMiles.toFixed(2);
    document.querySelector("#results #marathons")!.textContent =
      totalMarathonsWalked.toFixed(2);
  }
}

function handleFileSelect(event: Event) {
  const fileInputEl: HTMLInputElement | null = event.target as HTMLInputElement;

  if (!fileInputEl) {
    handleFileProcessed({
      error: "No file selected.",
    });
    return;
  }

  fileInputEl.classList.add("hidden");
  document.querySelector("#fileProcessing")!.classList.remove("hidden");
  document.querySelector("#fileError")!.classList.add("hidden");

  // timeout of 1 just to make sure that the the browser
  // has had time to show 'Processing...' and hide the file input.
  // otherwise, the unzip is very cpu-heavy and hangs the browser
  // before the above UI updates do happen
  setTimeout(() => {
    const files = fileInputEl.files;

    if (!files || files.length === 0) {
      handleFileProcessed({
        error: "No file selected.",
      });
      return;
    }

    // unzip the file
    unzip(files[0])
      .then(({ entries }) => {
        // find "apple_health_export/export.xml" entry
        const exportXMLFile = entries["apple_health_export/export.xml"];
        if (!exportXMLFile) {
          handleFileProcessed({
            error: "This doesn't look like a Health export file.",
          });
          return;
        }

        // read the file
        exportXMLFile.text().then((text) => {
          // parse the file
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "application/xml");

          let totalWalkedDistanceKm = 0;
          // find all <Record type="HKQuantityTypeIdentifierDistanceWalkingRunning"
          let foundValidRecords = 0;
          let foundErrorParsingRecords = false;

          doc
            .querySelectorAll(
              'Record[type="HKQuantityTypeIdentifierDistanceWalkingRunning"]'
            )
            .forEach((record) => {
              // get the value attribute
              const value = record.getAttribute("value");
              const unit = record.getAttribute("unit");

              if (!value || !unit) {
                foundErrorParsingRecords = true;
                return;
              }

              // add to totalWalkedDistanceKm
              if (unit === "mi") {
                // convert to km
                totalWalkedDistanceKm += parseFloat(value) * 1.60934;
                foundValidRecords++;
              } else if (unit === "km") {
                totalWalkedDistanceKm += parseFloat(value);
                foundValidRecords++;
              } else {
                foundErrorParsingRecords = true;
                return;
              }
            });

          if (foundValidRecords === 0) {
            handleFileProcessed({
              error: "No walking data found.",
            });
            return;
          }

          if (foundErrorParsingRecords) {
            handleFileProcessed({
              error: "Error parsing walking data.",
            });
            return;
          }

          handleFileProcessed({
            totalWalkedDistanceKm,
          });
        });
      })
      .catch(() => {
        handleFileProcessed({
          error: "We could not decode your zip file, sorry.",
        });
      });
  }, 100);
}

document.addEventListener("DOMContentLoaded", function () {
  initRunners();

  // bind file input on change event
  document
    .querySelector('input[type="file"]')!
    .addEventListener("change", handleFileSelect);
});
