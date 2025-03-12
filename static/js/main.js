document.addEventListener('DOMContentLoaded', () => {
    // Enhanced tab switching functionality
    const initTabs = () => {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        const switchTab = (targetTab) => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === targetTab) {
                    btn.classList.add('active');
                }
            });

            tabContents.forEach(content => {
                console.log("Clicked")
                content.classList.remove('active');
                if (content.dataset.tab === targetTab) {
                    content.classList.add('active');
                    
                    // Animate content
                    content.style.opacity = '0';
                    content.style.display = 'block';
                    setTimeout(() => {
                        content.style.opacity = '1';
                    }, 50);
                }
            });
        };

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
        });
    };

    // Enhanced search functionality with highlighting
    const initSearch = () => {
        const searchInput = document.querySelector('.search-box input');
        const navItems = document.querySelectorAll('.nav-items a');
        const navGroups = document.querySelectorAll('.nav-group');

        const highlightText = (element, query) => {
            const text = element.textContent;
            if (!query) {
                element.innerHTML = text;
                return;
            }

            const regex = new RegExp(`(${query})`, 'gi');
            element.innerHTML = text.replace(regex, '<mark>$1</mark>');
        };

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isVisible = text.includes(searchTerm);
                item.style.display = isVisible ? 'block' : 'none';
                highlightText(item, searchTerm);
            });

            // Show/hide groups based on whether they have visible items
            navGroups.forEach(group => {
                const hasVisibleItems = Array.from(group.querySelectorAll('a'))
                    .some(item => item.style.display !== 'none');
                group.style.display = hasVisibleItems ? 'block' : 'none';
            });
        });
    };

    // Smooth scrolling for anchor links
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };

    // Active link highlighting based on scroll position
    const initScrollSpy = () => {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-items a');

        const updateActiveLink = () => {
            let currentSection = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop - 100) {
                    currentSection = '#' + section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentSection) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', updateActiveLink);
        updateActiveLink(); // Initial call
    };

    // Copy code button functionality
    const initCodeCopy = () => {
        document.querySelectorAll('pre code').forEach(block => {
            const button = document.createElement('button');
            button.className = 'btn btn-secondary copy-button';
            button.innerHTML = 'Copy';
            
            block.parentNode.style.position = 'relative';
            block.parentNode.appendChild(button);

            button.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(block.textContent);
                    button.innerHTML = 'Copied!';
                    setTimeout(() => {
                        button.innerHTML = 'Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    button.innerHTML = 'Failed';
                }
            });
        });
    };

    // Initialize all features
    initTabs();
    initSearch();
    initSmoothScroll();
    initScrollSpy();
    initCodeCopy();
});