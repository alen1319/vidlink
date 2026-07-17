const DATE = { en: "July 17, 2026", zh: "2026年7月17日" };

export const LEGAL = {
  en: {
    privacy: {
      title: "Privacy Policy", updated: DATE.en,
      intro: "This Privacy Policy explains what information Vidlink collects when you use our website, how we use it, and the choices you have. By using Vidlink you agree to the practices described here.",
      sections: [
        { h: "1. Information We Collect", p: ["Vidlink is designed to be privacy-first. We do not require an account and we do not store the video links you paste — links are processed to fetch download options and are then discarded.", "We automatically collect limited technical data such as your browser type, device, approximate region and pages visited. This is standard server and analytics information used to keep the service reliable."] },
        { h: "2. Cookies & Tracking Technologies", p: ["We use cookies and similar technologies to remember your preferences (such as language and theme), measure traffic, and — only with your consent — deliver personalised advertising. You can accept or decline non-essential cookies through our consent banner at any time.", "You can also control cookies through your browser settings. Disabling cookies may affect some site features."] },
        { h: "3. Advertising & Google AdSense", p: ["Vidlink is supported by advertising. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.", "Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits. You may opt out of personalised advertising by visiting Google Ads Settings (adssettings.google.com), or opt out of third-party cookies at aboutads.info.", "For more information on how Google uses data, see Google's Privacy & Terms at policies.google.com/technologies/partner-sites."] },
        { h: "4. How We Use Information", p: ["We use the limited data we collect to operate and improve the service, prevent abuse and fraud, understand aggregate usage, and display advertising that keeps Vidlink free to use."] },
        { h: "5. Your Rights", p: ["Depending on your location, you may have rights under the GDPR (EEA/UK) or CCPA (California), including the right to access, correct, or delete your personal data, and to withdraw consent. Because we store minimal personal data, most requests relate to cookie preferences, which you can change at any time via the consent banner.", "To exercise any right, contact us using the details on our Contact page."] },
        { h: "6. Data Retention", p: ["We do not retain pasted URLs or downloaded files. Aggregate analytics and consent records are kept only as long as necessary for the purposes described above."] },
        { h: "7. Children's Privacy", p: ["Vidlink is not directed to children under 13 (or the relevant age in your country) and we do not knowingly collect their personal data."] },
        { h: "8. Changes to This Policy", p: ["We may update this policy from time to time. Material changes will be reflected by the “Last updated” date above."] },
      ],
    },
    terms: {
      title: "Terms of Service", updated: DATE.en,
      intro: "These Terms govern your use of Vidlink. By accessing or using the service, you agree to be bound by them.",
      sections: [
        { h: "1. Acceptance of Terms", p: ["By using Vidlink you confirm that you are able to form a binding contract and that you will comply with these Terms and all applicable laws."] },
        { h: "2. Permitted Use", p: ["Vidlink is provided as a convenience tool for downloading media that you own, that is in the public domain, or that you have explicit permission to download. You are solely responsible for ensuring your use complies with the terms of the source platform and with copyright law."] },
        { h: "3. Prohibited Use", p: ["You may not use Vidlink to infringe intellectual property rights, to download content you are not authorised to access, or in any way that violates applicable law. We may restrict access to anyone who misuses the service."] },
        { h: "4. Intellectual Property", p: ["The Vidlink name, logo, and website design are the property of Vidlink. Downloaded content remains the property of its respective rights holders; Vidlink claims no ownership over it."] },
        { h: "5. Disclaimer", p: ["The service is provided “as is” without warranties of any kind. We do not guarantee that downloads will always be available, accurate, or error-free."] },
        { h: "6. Limitation of Liability", p: ["To the maximum extent permitted by law, Vidlink is not liable for any indirect or consequential damages arising from your use of the service, including any misuse of downloaded content."] },
        { h: "7. Changes", p: ["We may modify these Terms at any time. Continued use of Vidlink after changes constitutes acceptance of the updated Terms."] },
      ],
    },
    dmca: {
      title: "DMCA / Copyright Policy", updated: DATE.en,
      intro: "Vidlink respects the intellectual property rights of others and expects its users to do the same. Vidlink is a general-purpose tool and does not host, store, or distribute any user content.",
      sections: [
        { h: "Our Position", p: ["Vidlink does not upload or host any videos. It acts only as a technical means for users to access media they are entitled to. We do not control and are not responsible for the content available on third-party platforms."] },
        { h: "Filing a Notice", p: ["If you believe your copyrighted work is being made accessible in a way that constitutes infringement, please send a written notice including: identification of the copyrighted work, the specific URL, your contact information, a good-faith statement, and your electronic signature.", "Send notices to the address listed on our Contact page. We will respond to valid notices in accordance with the DMCA."] },
        { h: "Counter-Notice", p: ["If you believe content was removed in error, you may submit a counter-notice with the same categories of information described above."] },
      ],
    },
    about: {
      title: "About Vidlink", updated: DATE.en,
      intro: "Vidlink is a free, clean online tool that helps people save videos from the platforms they use every day — without clutter, sign-ups, or watermarks.",
      sections: [
        { h: "Our Mission", p: ["We believe downloading a video you have the right to keep should be simple, fast, and respectful of your privacy. Vidlink strips away the pop-ups, redirects, and dark patterns common to this category and replaces them with one calm, well-crafted interface."] },
        { h: "How It Works", p: ["Paste a link, and Vidlink fetches the available formats and qualities directly. You choose what you want — 1080p, 720p, 480p or audio-only MP3 — and download it in a single click. We never store your links or files."] },
        { h: "Supported Platforms", p: ["Vidlink works with YouTube, TikTok / 抖音, Instagram, Twitter / X, Facebook, Bilibili and most major video platforms. A free browser extension adds a download button directly under each video."] },
      ],
    },
    contact: {
      title: "Contact Us", updated: DATE.en,
      intro: "We'd love to hear from you — whether it's feedback, a partnership, a press enquiry, or a legal/copyright matter.",
      sections: [
        { h: "General & Support", p: ["Email: hello@vidlink.app", "We aim to respond to all enquiries within 2–3 business days."] },
        { h: "Legal & Copyright", p: ["For DMCA notices and legal matters: legal@vidlink.app"] },
        { h: "Advertising", p: ["For advertising and partnership enquiries: partners@vidlink.app"] },
      ],
    },
  },
  zh: {
    privacy: {
      title: "隐私政策", updated: DATE.zh,
      intro: "本隐私政策说明 Vidlink 在您使用本网站时收集哪些信息、如何使用这些信息，以及您所拥有的选择权。使用 Vidlink 即表示您同意本政策所述的做法。",
      sections: [
        { h: "1. 我们收集的信息", p: ["Vidlink 以隐私优先为设计原则。我们不要求注册账户，也不会保存您粘贴的视频链接——链接仅用于获取下载选项，随后即被丢弃。", "我们会自动收集有限的技术数据，例如浏览器类型、设备、大致地区和访问页面。这属于用于保障服务稳定的常规服务器与分析信息。"] },
        { h: "2. Cookie 与跟踪技术", p: ["我们使用 Cookie 及类似技术来记住您的偏好（如语言与主题）、分析流量，并且仅在您同意后投放个性化广告。您可随时通过同意横幅接受或拒绝非必要 Cookie。", "您也可通过浏览器设置管理 Cookie。禁用 Cookie 可能影响部分功能。"] },
        { h: "3. 广告与 Google AdSense", p: ["Vidlink 由广告支持。包括 Google 在内的第三方供应商会使用 Cookie，根据您此前对本站及其他网站的访问来投放广告。", "Google 使用广告 Cookie，使其及合作伙伴能够根据您的访问投放广告。您可访问 Google 广告设置（adssettings.google.com）停用个性化广告，或在 aboutads.info 停用第三方 Cookie。", "有关 Google 如何使用数据，请参阅 policies.google.com/technologies/partner-sites。"] },
        { h: "4. 我们如何使用信息", p: ["我们使用所收集的有限数据来运营和改进服务、防止滥用与欺诈、了解总体使用情况，并展示广告以维持 Vidlink 免费使用。"] },
        { h: "5. 您的权利", p: ["根据您所在地区，您可能享有 GDPR（欧洲经济区/英国）或 CCPA（加州）下的权利，包括访问、更正或删除个人数据以及撤回同意的权利。由于我们仅存储极少个人数据，多数请求与 Cookie 偏好相关，您可随时通过同意横幅进行更改。", "如需行使任何权利，请通过“联系我们”页面所列方式与我们联系。"] },
        { h: "6. 数据保留", p: ["我们不保留粘贴的网址或下载的文件。汇总分析与同意记录仅在上述目的所需的期限内保留。"] },
        { h: "7. 儿童隐私", p: ["Vidlink 并非面向 13 岁以下（或您所在国家的相应年龄）的儿童，我们不会有意收集其个人数据。"] },
        { h: "8. 政策变更", p: ["我们可能会不时更新本政策。重大变更将以上方的“最近更新”日期体现。"] },
      ],
    },
    terms: {
      title: "服务条款", updated: DATE.zh,
      intro: "本条款约束您对 Vidlink 的使用。访问或使用本服务即表示您同意受其约束。",
      sections: [
        { h: "1. 条款的接受", p: ["使用 Vidlink 即表示您确认具备订立具有约束力合同的能力，并将遵守本条款及所有适用法律。"] },
        { h: "2. 允许的用途", p: ["Vidlink 作为便利工具，供您下载您拥有、处于公有领域或已获明确许可下载的媒体。您须自行确保使用符合来源平台条款及版权法。"] },
        { h: "3. 禁止的用途", p: ["您不得使用 Vidlink 侵犯知识产权、下载您无权访问的内容，或以任何违反适用法律的方式使用。对于滥用服务者，我们可能限制其访问。"] },
        { h: "4. 知识产权", p: ["Vidlink 名称、标志及网站设计归 Vidlink 所有。下载的内容仍归各自权利人所有，Vidlink 不主张任何所有权。"] },
        { h: "5. 免责声明", p: ["本服务按“现状”提供，不作任何形式的保证。我们不保证下载始终可用、准确或无错误。"] },
        { h: "6. 责任限制", p: ["在法律允许的最大范围内，Vidlink 不对因使用本服务（包括对下载内容的任何滥用）而产生的任何间接或后果性损害承担责任。"] },
        { h: "7. 变更", p: ["我们可能随时修改本条款。变更后继续使用 Vidlink 即视为接受更新后的条款。"] },
      ],
    },
    dmca: {
      title: "DMCA / 版权政策", updated: DATE.zh,
      intro: "Vidlink 尊重他人的知识产权，并期望用户同样如此。Vidlink 是一款通用工具，不托管、存储或分发任何用户内容。",
      sections: [
        { h: "我们的立场", p: ["Vidlink 不上传或托管任何视频，仅作为用户访问其有权获取媒体的技术手段。我们不控制也不对第三方平台上的内容负责。"] },
        { h: "提交通知", p: ["若您认为您的受版权保护作品以构成侵权的方式被访问，请发送书面通知，包含：受版权保护作品的说明、具体网址、您的联系方式、诚信声明及您的电子签名。", "请将通知发送至“联系我们”页面所列地址。我们将依据 DMCA 对有效通知作出回应。"] },
        { h: "反通知", p: ["若您认为内容被误删，您可提交包含上述同类信息的反通知。"] },
      ],
    },
    about: {
      title: "关于 Vidlink", updated: DATE.zh,
      intro: "Vidlink 是一款免费、纯净的在线工具，帮助人们从每天使用的平台上保存视频——没有杂乱、无需注册、也没有水印。",
      sections: [
        { h: "我们的使命", p: ["我们相信，下载一段您有权保存的视频，应当简单、快速且尊重隐私。Vidlink 去除了此类工具常见的弹窗、跳转与暗黑模式，代之以一个平静、精心打磨的界面。"] },
        { h: "工作原理", p: ["粘贴链接，Vidlink 会直接获取可用的格式与清晰度。您选择所需内容——1080p、720p、480p 或纯音频 MP3——一键下载。我们绝不保存您的链接或文件。"] },
        { h: "支持的平台", p: ["Vidlink 支持 YouTube、TikTok / 抖音、Instagram、Twitter / X、Facebook、Bilibili 及大多数主流视频平台。免费浏览器插件会在每个视频下方添加下载按钮。"] },
      ],
    },
    contact: {
      title: "联系我们", updated: DATE.zh,
      intro: "无论是反馈、合作、媒体咨询，还是法律/版权事宜，我们都很乐意听到您的声音。",
      sections: [
        { h: "一般与支持", p: ["邮箱：hello@vidlink.app", "我们力争在 2–3 个工作日内回复所有咨询。"] },
        { h: "法律与版权", p: ["DMCA 通知及法律事宜：legal@vidlink.app"] },
        { h: "广告合作", p: ["广告与合作咨询：partners@vidlink.app"] },
      ],
    },
  },
};
