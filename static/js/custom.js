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

function offsetAnchor() {
    if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 48);
    }
}

window.addEventListener("hashchange", offsetAnchor);

window.setTimeout(offsetAnchor, 1); // The delay of 1 is arbitrary and may not always work right (although it did in my testing).