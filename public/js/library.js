function showSection(section) {
    const newsContainer = document.getElementById('news-container');
    const eventsContainer = document.getElementById('events-container');

    if (section === 'news') {
        newsContainer.style.display = 'flex';
        eventsContainer.style.display = 'none';
    } else if (section === 'events') {
        newsContainer.style.display = 'none';
        eventsContainer.style.display = 'flex';

        // Gọi lại setupScroll cho phần sự kiện sau khi hiển thị
        setupScroll(eventsContainer, '.events-grid');
    }

    const grid = section === 'news' ? newsContainer.querySelector('.news-grid') : eventsContainer.querySelector('.events-grid');
    grid.scrollLeft = 0;
}

// Hàm xử lý cuộn cho một container cụ thể
function setupScroll(container, gridSelector) {
    const grid = container.querySelector(gridSelector);
    const prevBtn = container.querySelector('.prev-btn');
    const nextBtn = container.querySelector('.next-btn');
    const itemWidth = 330; // Chiều rộng mỗi item (300px + 30px gap)
    const visibleItems = 3;
    const maxScroll = grid.scrollWidth - (itemWidth * visibleItems);

    nextBtn.addEventListener('click', () => {
        if (grid.scrollLeft < maxScroll) {
            grid.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
    });

    prevBtn.addEventListener('click', () => {
        if (grid.scrollLeft > 0) {
            grid.scrollBy({ left: -itemWidth, behavior: 'smooth' });
        }
    });
}

// Áp dụng cho cả tin tức và sự kiện
const newsContainer = document.getElementById('news-container');
const eventsContainer = document.getElementById('events-container');
setupScroll(newsContainer, '.news-grid');
setupScroll(eventsContainer, '.events-grid');