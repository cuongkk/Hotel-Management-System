document.addEventListener("DOMContentLoaded", function () {
  const searchRoom = document.getElementById("searchRoom");
  const filterStatus = document.getElementById("filterStatus");
  const filterTypeRoom = document.getElementById("filterTypeRoom");
  const roomItems = document.querySelectorAll(".room-item");
  const noResult = document.getElementById("noResult");

  if (!searchRoom || !filterStatus || !filterTypeRoom) return;

  function filterRooms() {
    const searchText = searchRoom.value.trim();
    const statusValue = filterStatus.value;
    const typeRoomValue = filterTypeRoom.value;

    let visibleCount = 0;

    roomItems.forEach((item) => {
      const name = item.dataset.name;
      const type = item.dataset.type;
      const status = item.dataset.status;

      const matchesSearch = name.includes(searchText);
      const matchesStatus = statusValue === "ALL" || status === statusValue;
      const matchesType = typeRoomValue === "ALL" || type === typeRoomValue;

      if (matchesSearch && matchesStatus && matchesType) {
        item.classList.remove("hidden");
        visibleCount++;
      } else {
        item.classList.add("hidden");
      }
    });

    if (visibleCount === 0) {
      noResult.classList.remove("hidden");
      noResult.classList.add("flex");
    } else {
      noResult.classList.add("hidden");
      noResult.classList.remove("flex");
    }
  }

  searchRoom.addEventListener("input", filterRooms);
  filterStatus.addEventListener("change", filterRooms);
  filterTypeRoom.addEventListener("change", filterRooms);
});
