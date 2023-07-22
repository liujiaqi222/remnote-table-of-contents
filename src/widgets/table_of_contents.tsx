import { renderWidget, usePlugin, useTracker, RemId } from '@remnote/plugin-sdk';
import {
  convertContentsToFlatList,
  expandHighestCollapsedAncestor,
  generateContents,
} from '../lib/utils';

export const TableOfContentsWidget = () => {
  const plugin = usePlugin();
  const lastOpenedRemId = useTracker(async (reactivePlugin) => {
    return await reactivePlugin.storage.getLocal('TOC_lastOpenedRemId');
  });
  const contents =
    useTracker(
      async (reactivePlugin) => {
        const paneId = await reactivePlugin.window.getFocusedPaneId();
        const remId = await reactivePlugin.window.getOpenPaneRemId(paneId);
        const rem = await reactivePlugin.rem.findOne(remId);
        if (!rem) return [];
        await rem.allRemInDocumentOrPortal(); // track the changes of all rems
        return await generateContents(rem, plugin);
      },
      [lastOpenedRemId]
    ) || [];

  // TODO: add a spinner to distinguish between no contents and loading
  if (contents.length === 0) {
    return (
      <nav className="rounded py-1 px-4">
        <h1 className="text-lg">No headings in this page</h1>
        <p>Use headings to create a table of contents and organize your knowledge!</p>
      </nav>
    );
  }

  const flatContents = convertContentsToFlatList(contents);

  const jumpToRem = async (remId: RemId) => {
    // expand the highest collapsed ancestor rem in order to jump to the rem
    await expandHighestCollapsedAncestor(remId, plugin);
    // remove focus if some rems are selected
    await plugin.editor.selectText({ start: 0, end: 0 });
    // jump to the rem
    await plugin.editor.selectRem([remId]);
  };

  return (
    <nav className="rounded py-1 px-4 h-full overflow-y-auto">
      <h1 className="text-lg">Contents</h1>
      <hr className="border-gray-300" />
      <ul className="p-0 space-y-3 list-none">
        {flatContents.map((content, i) => (
          <li className={`ml-${(content.depth - 1) * 4}`}>
            <a
              key={`${content.id}_${i}`}
              href="#"
              onClick={async () => await jumpToRem(content.id)}
              className="flex text-base"
            >
              <span>{content.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

renderWidget(TableOfContentsWidget);
