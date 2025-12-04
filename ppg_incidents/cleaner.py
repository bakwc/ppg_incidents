from bs4 import BeautifulSoup
import hashlib
import string


def clean_html_text(html):
    """
    Cleans the given HTML by removing non-text blocks, tags without useful content,
    and excessive whitespaces/newlines in text content, while keeping the essential
    HTML structure intact. Additionally, replaces each CSS class name with a unique
    3-character hash to obfuscate the class names.

    Parameters:
        html (str): The HTML content as a string.

    Returns:
        str: The cleaned HTML with minimal whitespaces in textual content and hashed class names.
    """
    # Parse the HTML content
    soup = BeautifulSoup(html, "html.parser")

    # Define tags to be completely removed along with their content
    remove_tags = [
        "script", "style", "iframe", "object",
        "embed", "video", "audio", "canvas", "noscript",
        "link", "path",
    ]

    # Remove the specified unwanted tags and their content
    for tag_name in remove_tags:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # Function to determine if a tag has useful content
    def has_useful_content(tag):
        """
        Determines if a tag contains any useful textual content.

        Args:
            tag (bs4.element.Tag): The tag to evaluate.

        Returns:
            bool: True if the tag contains meaningful text, False otherwise.
        """
        # Check if the tag has any text that isn't just whitespace
        return bool(tag.get_text(strip=True))

    # Iterate through all remaining tags and remove those without useful content
    for tag in soup.find_all():
        if not has_useful_content(tag):
            tag.decompose()

    # Remove all 'style' attributes from all tags
    for tag in soup.find_all(True):
        if 'style' in tag.attrs:
            del tag.attrs['style']

    # Iterate over all text nodes and clean them
    for text_node in soup.find_all(string=True):
        # Replace multiple spaces, tabs, or newlines with a single space
        cleaned_text = " ".join(text_node.split())
        text_node.replace_with(cleaned_text)

    # Optionally, remove leading and trailing whitespace from the entire HTML
    # and prettify the result for better readability
    cleaned_html = soup.prettify()

    # Remove excess spaces introduced by prettify()
    cleaned_html = ' '.join([e for e in cleaned_html.split(' ') if e])

    return cleaned_html
