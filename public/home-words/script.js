// Poem text
const kiplingPoem = `<p>小一，如果你能<span>看到</span>我心里跳动的声音，  
在这茫茫人海中，我只想<span>遇见</span>你；  
如果你能<span>感受</span>我每一次发来的消息，  
哪怕只是文字，也能让你心里泛起<span>微笑</span>；  

如果你能<span>理解</span>我小小的暗示，  
即便我没说出口，你也能<span>读懂</span>我的心；  
如果你能<span>接受</span>我不完美的表达，  
仍然愿意<span>靠近</span>，那我就足够幸运；  

如果你能和我<span>一起</span>经历平凡的日子，  
也一起<span>记录</span>那些特别的瞬间；  
如果你能在每一次晚安和问候中  
感受到<span>牵挂</span>和温暖的回响；  

如果你能和我<span>分享</span>笑声，也分担忧愁，  
在旅行的风里，在日常的烟火里，  
都能<span>感到</span>我们的频率相同；  

如果你能<span>允许</span>我慢慢靠近你，  
把心意化作文字、行动和温柔的陪伴，  
那么小一，<span>你就是</span>我想珍惜的人；  
在这漫长世界里，<span>我喜欢你</span>，  
希望能<span>和你一起</span>走过每一段日子，慢慢变成美好的记忆。 - 来自心底的我</p>`;

// Function to insert poem into divs
function insertPoemIntoDivs() {
	// Get all .text divs
	const textDivs = document.querySelectorAll(".text");

	// Insert poem into all .text divs
	textDivs.forEach((div) => {
		div.innerHTML = kiplingPoem;
	});
}

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", insertPoemIntoDivs);

const contentDiv = document.querySelector(".content");
function adjustContentSize() {
	const viewportWidth = window.innerWidth;
	const baseWidth = 1000;
	const scaleFactor =
		viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.8 : 1;
	contentDiv.style.transform = `scale(${scaleFactor})`;
}
window.addEventListener("load", adjustContentSize);
window.addEventListener("resize", adjustContentSize);
