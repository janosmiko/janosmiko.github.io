const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('content')) {
                entry.target.classList.add('show-content');
            } else {
                entry.target.classList.add('show');
            }
        // } else {
        //     if (entry.target.classList.contains('content')) {
        //         entry.target.classList.remove('show-content');
        //     } else {
        //         entry.target.classList.remove('show');
        //     }
        }
    });
});

const hiddenElementsLeft = document.querySelectorAll('.fading-left');
hiddenElementsLeft.forEach((el) => observer.observe(el));

const hiddenElementsRight = document.querySelectorAll('.fading-right');
hiddenElementsRight.forEach((el) => observer.observe(el));

const hiddenElementsContentP = document.querySelectorAll('.content');
hiddenElementsContentP.forEach((el) => observer.observe(el));

// The function actually applying the offset
function offsetAnchor() {
    if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 48);
    }
}

// This will capture hash changes while on the page
window.addEventListener("hashchange", offsetAnchor);

// This is here so that when you enter the page with a hash,
// it can provide the offset in that case too. Having a timeout
// seems necessary to allow the browser to jump to the anchor first.
window.setTimeout(offsetAnchor, 1); // The delay of 1 is arbitrary and may not always work right (although it did in my testing).