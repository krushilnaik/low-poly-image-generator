from bs4 import ResultSet, Tag
from lxml import etree
from typing_extensions import Self


class Tree:
    def __init__(self, name: str, method: str | None = None):
        self.name = name
        self.method = method
        self.children = []

    def add_child(self, child_node: Self):
        self.children.append(child_node)

    def get_children(self) -> list[Self]:
        return self.children

    def __repr__(self, level: int = 0):
        string = "  " * level + f"({self.method or 'base'}) {self.name}" + "\n"
        for child in self.children:
            string += child.__repr__(level + 1)
        return string


id_query = ".//span[contains(@class, 'text-muted')]/small[1]"
suffix_query = ".//small[not(a)][preceding-sibling::br] | .//a[@class='ent-name'][not(following-sibling::br/following-sibling::small[not(a)])]"
name_query = ".//a[@class='ent-name']"


def get_paths(t: Tree, paths: list[dict[str, list[str]]] | None = None, current: dict[str, list[str]] | None = None):
    if paths is None:
        paths = []
    if current is None:
        current = {"chain": [], "methods": []}

    current["chain"] = current["chain"] + [t.name]

    if t.method:
        current["methods"] = current["methods"] + [t.method]

    if len(t.children) == 0:
        paths.append(current)
    else:
        for child in t.children:
            get_paths(child, paths, dict(current))

    return paths


def build_evolution_tree(dom: Tag):
    root_card = dom.select_one("& > .infocard")
    root_card = etree.HTML(str(root_card), None)

    root_id = root_card.xpath(id_query)[0].text[1:]
    root_suffix = root_card.xpath(suffix_query)[0].text
    root_name = root_card.xpath(name_query)[0].text
    root_value = (
        root_id if root_suffix == root_name else f"{root_id}-{root_suffix.replace(root_name, '').replace(' ', '')}"
    )

    root = Tree(root_value)

    def add_evolution_children(node: Tree, element: Tag):
        branches = element.select("& > :not(:first-child), & > .infocard-arrow")

        head = node
        method = ""

        for b in branches:
            if b.text.strip() == "+":
                pass
            elif "arrow" in str(b.attrs["class"]):
                method = b.text[1:-1]
            elif "split" not in str(b.attrs["class"]):
                card = etree.HTML(str(b), None)

                pid = card.xpath(id_query)[0].text[1:]
                suffix = card.xpath(suffix_query)[0].text
                name = card.xpath(name_query)[0].text

                value = pid if suffix == name else f"{pid}-{suffix.replace(name, '').replace(' ', '')}"

                temp = Tree(value, method)
                head.add_child(temp)
                head = temp
            else:
                for sub in b.select("& > .infocard-list-evo"):
                    add_evolution_children(head, sub)

    add_evolution_children(root, dom)

    return root


def get_chains(charts: ResultSet[Tag]):
    trees: dict[str, Tree] = {}

    for chart in charts:
        tree = build_evolution_tree(chart)

        if trees.get(tree.name):
            for branch in tree.get_children():
                trees[tree.name].add_child(branch)
        else:
            trees[tree.name] = tree

    return {pokemon: get_paths(tree) for pokemon, tree in trees.items()}
