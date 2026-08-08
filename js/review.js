/**
 * UstadJi - Reviews Module
 */

const ReviewModule = {
  currentBookingId: null,
  currentWorkerId: null,
  selectedRating: 0,

  openReview(bookingId, workerId) {
    this.currentBookingId = bookingId;
    this.currentWorkerId = workerId;
    this.selectedRating = 0;

    const modal = document.getElementById("review-modal");
    if (!modal) {
      this.createModal();
    }
    document.getElementById("review-modal")?.classList.remove("hidden");
    this.renderStars();
  },

  createModal() {
    const html = `
      <div id="review-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="ReviewModule.close()"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in-up">
            <button onclick="ReviewModule.close()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <i class="fas fa-times text-lg"></i>
            </button>
            <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-1">Rate Your Experience</h3>
            <p class="text-sm text-slate-500 mb-6">How was the service?</p>
            
            <div id="review-stars" class="flex justify-center gap-2 mb-6"></div>
            
            <textarea id="review-comment" rows="3" placeholder="Write your review (optional)…"
                      class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none mb-4"></textarea>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add photos (optional)</label>
              <input type="file" id="review-images" accept="image/*" multiple class="text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium hover:file:bg-primary-100">
            </div>
            
            <button onclick="ReviewModule.submit()" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors">
              Submit Review
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
  },

  renderStars() {
    const container = document.getElementById("review-stars");
    if (!container) return;

    container.innerHTML = [1, 2, 3, 4, 5]
      .map(
        (i) => `
      <button type="button" onclick="ReviewModule.setRating(${i})" class="text-3xl transition-transform hover:scale-110 ${i <= this.selectedRating ? "text-amber-400" : "text-slate-300"}">
        <i class="${i <= this.selectedRating ? "fas" : "far"} fa-star"></i>
      </button>
    `
      )
      .join("");
  },

  setRating(r) {
    this.selectedRating = r;
    this.renderStars();
  },

  close() {
    document.getElementById("review-modal")?.classList.add("hidden");
  },

  async submit() {
    if (this.selectedRating < 1) {
      Helper.toast("Please select a rating", "warning");
      return;
    }

    const comment = document.getElementById("review-comment")?.value || "";
    const files = document.getElementById("review-images")?.files;

    try {
      Helper.showLoader();

      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("booking_id", this.currentBookingId);
        formData.append("worker_id", this.currentWorkerId);
        formData.append("rating", this.selectedRating);
        formData.append("comment", comment);
        for (const f of files) formData.append("images", f);
        await API.upload("/reviews", formData);
      } else {
        await API.reviews.create({
          booking_id: this.currentBookingId,
          worker_id: this.currentWorkerId,
          rating: this.selectedRating,
          comment,
        });
      }

      Helper.toast("Thank you for your review!", "success");
      this.close();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },
};
